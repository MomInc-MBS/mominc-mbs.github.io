#!/usr/bin/env python3
"""Validate a HIVE research vault using only the Python standard library.

Checks the declared graph, generated Markdown notes, source archive, and Canvas.
It does not execute archived code, access the network, or scan outside the vault.
"""

from __future__ import annotations

import argparse
from collections import defaultdict, deque
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import sys
from urllib.parse import unquote, urlsplit


class Validator:
    def __init__(self, vault: Path) -> None:
        self.vault = vault.resolve()
        self.errors: list[dict[str, str]] = []
        self.counts: dict[str, int] = {
            "graph_nodes": 0,
            "graph_edges": 0,
            "generated_markdown_nodes": 0,
            "markdown_links_checked": 0,
            "external_links_ignored": 0,
            "wikilinks_checked": 0,
            "archive_files": 0,
            "archive_bytes": 0,
            "canvas_nodes": 0,
            "canvas_edges": 0,
            "reachable_nodes": 0,
            "orphan_nodes": 0,
        }
        self.nodes: dict[str, dict] = {}
        self.node_paths: dict[str, Path] = {}
        self.archive_paths: set[Path] = set()
        self.note_names: dict[str, set[Path]] = defaultdict(set)

    def error(self, code: str, path: str | Path, message: str) -> None:
        self.errors.append(
            {"code": code, "path": str(path), "message": message}
        )

    def label(self, path: Path) -> str:
        try:
            return path.relative_to(self.vault).as_posix()
        except ValueError:
            return str(path)

    def local_path(
        self, value: object, source: str | Path, base: Path | None = None
    ) -> Path | None:
        if not isinstance(value, str) or not value.strip():
            self.error("INVALID_PATH", source, "A nonempty relative path is required.")
            return None
        if "\x00" in value or "\\" in value:
            self.error("INVALID_PATH", source, f"Invalid portable path: {value!r}")
            return None
        if PurePosixPath(value).is_absolute() or re.match(r"^[A-Za-z]:", value):
            self.error("ABSOLUTE_PATH", source, f"Path must be vault-relative: {value}")
            return None
        candidate = ((base or self.vault) / value).resolve()
        try:
            candidate.relative_to(self.vault)
        except ValueError:
            self.error("PATH_OUTSIDE_VAULT", source, f"Path escapes the vault: {value}")
            return None
        return candidate

    def read_json(self, relative: str) -> object | None:
        path = self.local_path(relative, relative)
        if path is None:
            return None
        try:
            return json.loads(path.read_text(encoding="utf-8-sig"))
        except (OSError, UnicodeError, json.JSONDecodeError) as exc:
            self.error("JSON_READ_ERROR", relative, str(exc))
            return None

    def check_archive(self) -> None:
        manifest = self.read_json("99_Data/archive_manifest.json")
        if not isinstance(manifest, list):
            if manifest is not None:
                self.error("ARCHIVE_SCHEMA", "99_Data/archive_manifest.json",
                           "Archive manifest must be a list.")
            return
        seen: set[Path] = set()
        for index, item in enumerate(manifest):
            where = f"99_Data/archive_manifest.json[{index}]"
            if not isinstance(item, dict):
                self.error("ARCHIVE_SCHEMA", where, "Entry must be an object.")
                continue
            if not isinstance(item.get("original_name"), str) or not item["original_name"]:
                self.error("ARCHIVE_SCHEMA", where, "original_name must be nonempty.")
            path = self.local_path(item.get("path"), where)
            expected_hash = item.get("sha256")
            expected_size = item.get("size_bytes")
            if not isinstance(expected_hash, str) or not re.fullmatch(
                r"[0-9a-fA-F]{64}", expected_hash
            ):
                self.error("ARCHIVE_SCHEMA", where, "sha256 must be a 64-digit hex string.")
            if type(expected_size) is not int or expected_size < 0:
                self.error("ARCHIVE_SCHEMA", where, "size_bytes must be a nonnegative integer.")
            if path is None:
                continue
            self.archive_paths.add(path)
            if path in seen:
                self.error("DUPLICATE_ARCHIVE_PATH", where, self.label(path))
            seen.add(path)
            if not path.is_file():
                self.error("MISSING_ARCHIVE_FILE", where, self.label(path))
                continue
            try:
                digest = hashlib.sha256()
                size = 0
                with path.open("rb") as stream:
                    for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                        digest.update(chunk)
                        size += len(chunk)
                self.counts["archive_files"] += 1
                self.counts["archive_bytes"] += size
                if size != expected_size:
                    self.error("ARCHIVE_SIZE_MISMATCH", self.label(path),
                               f"Expected {expected_size}; found {size}.")
                if isinstance(expected_hash, str) and digest.hexdigest() != expected_hash.lower():
                    self.error("ARCHIVE_HASH_MISMATCH", self.label(path),
                               "SHA-256 differs from the archive manifest.")
            except OSError as exc:
                self.error("ARCHIVE_READ_ERROR", self.label(path), str(exc))

    def check_graph(self) -> None:
        graph = self.read_json("99_Data/research_graph.json")
        if not isinstance(graph, dict):
            if graph is not None:
                self.error("GRAPH_SCHEMA", "99_Data/research_graph.json",
                           "Graph must be an object.")
            return
        nodes, edges = graph.get("nodes"), graph.get("edges")
        if not isinstance(nodes, list) or not isinstance(edges, list):
            self.error("GRAPH_SCHEMA", "99_Data/research_graph.json",
                       "nodes and edges must be arrays.")
            return
        self.counts["graph_nodes"], self.counts["graph_edges"] = len(nodes), len(edges)
        used_paths: dict[Path, str] = {}
        for index, node in enumerate(nodes):
            where = f"99_Data/research_graph.json:nodes[{index}]"
            if not isinstance(node, dict):
                self.error("NODE_SCHEMA", where, "Node must be an object.")
                continue
            for field in ("id", "type", "title", "path", "status"):
                if not isinstance(node.get(field), str) or not node[field].strip():
                    self.error("NODE_SCHEMA", where, f"{field} must be a nonempty string.")
            node_id = node.get("id")
            if not isinstance(node_id, str) or not node_id.strip():
                continue
            if node_id in self.nodes:
                self.error("DUPLICATE_NODE_ID", where, node_id)
                continue
            self.nodes[node_id] = node
            path = self.local_path(node.get("path"), where)
            if path is None:
                continue
            self.node_paths[node_id] = path
            if path in used_paths:
                self.error("DUPLICATE_NODE_PATH", where,
                           f"{node_id} and {used_paths[path]} both use {self.label(path)}.")
            used_paths[path] = node_id
            if not path.is_file():
                self.error("MISSING_NODE_FILE", where, self.label(path))
                continue
            self.note_names[path.stem].add(path)

        adjacency: dict[str, set[str]] = {key: set() for key in self.nodes}
        edge_ids: set[str] = set()
        for index, edge in enumerate(edges):
            where = f"99_Data/research_graph.json:edges[{index}]"
            if not isinstance(edge, dict):
                self.error("EDGE_SCHEMA", where, "Edge must be an object.")
                continue
            edge_id = edge.get("id")
            if not isinstance(edge_id, str) or not edge_id.strip():
                self.error("EDGE_SCHEMA", where, "id must be a nonempty string.")
            elif edge_id in edge_ids:
                self.error("DUPLICATE_EDGE_ID", where, edge_id)
            else:
                edge_ids.add(edge_id)
            if not isinstance(edge.get("relation"), str) or not edge["relation"].strip():
                self.error("EDGE_SCHEMA", where, "relation must be nonempty.")
            valid = True
            for field in ("source", "target"):
                ref = edge.get(field)
                if not isinstance(ref, str) or ref not in self.nodes:
                    self.error("INVALID_EDGE_REFERENCE", where, f"{field}={ref!r}")
                    valid = False
            if valid:
                source, target = edge["source"], edge["target"]
                adjacency[source].add(target)
                adjacency[target].add(source)
        if "HOME" not in self.nodes:
            self.error("MISSING_HOME", "99_Data/research_graph.json", "HOME node is required.")
        else:
            reachable = {"HOME"}
            queue = deque(["HOME"])
            while queue:
                for neighbor in adjacency[queue.popleft()]:
                    if neighbor not in reachable:
                        reachable.add(neighbor)
                        queue.append(neighbor)
            self.counts["reachable_nodes"] = len(reachable)
            for node_id in sorted(set(self.nodes) - reachable):
                self.error("UNREACHABLE_NODE", self.nodes[node_id].get("path", node_id),
                           f"{node_id} is not reachable undirected from HOME.")
        for node_id, neighbors in adjacency.items():
            if len(self.nodes) > 1 and not (neighbors - {node_id}):
                self.counts["orphan_nodes"] += 1
                self.error("ORPHAN_NODE", self.nodes[node_id].get("path", node_id), node_id)

    @staticmethod
    def frontmatter_id(text: str) -> str | None:
        lines = text.lstrip("\ufeff").splitlines()
        if not lines or lines[0].strip() != "---":
            return None
        end = next((i for i in range(1, len(lines)) if lines[i].strip() == "---"), None)
        if end is None:
            return None
        match = re.search(r"^id[ \t]*:[ \t]*(.+?)[ \t]*$", "\n".join(lines[1:end]), re.M)
        if not match:
            return None
        value = match.group(1).strip()
        if value.startswith('"') and value.endswith('"'):
            try:
                value = json.loads(value)
            except json.JSONDecodeError:
                return None
        elif value.startswith("'") and value.endswith("'"):
            value = value[1:-1].replace("''", "'")
        else:
            value = re.split(r"\s+#", value, maxsplit=1)[0].strip()
        if not isinstance(value, str) or not value.strip() or value.lower() in ("null", "~"):
            return None
        return value

    @staticmethod
    def visible_markdown(text: str) -> str:
        """Remove fenced blocks and inline code while retaining line positions."""
        result: list[str] = []
        fence_char, fence_length = "", 0
        tick = chr(96)
        fence_pattern = re.compile(r"^ {0,3}(" + tick + r"{3,}|~{3,})(.*)$")
        for line in text.splitlines(keepends=True):
            match = fence_pattern.match(line)
            if fence_char:
                if (match and match.group(1)[0] == fence_char
                        and len(match.group(1)) >= fence_length
                        and not match.group(2).strip()):
                    fence_char, fence_length = "", 0
                result.append("\n" if line.endswith("\n") else "")
            elif match:
                fence_char, fence_length = match.group(1)[0], len(match.group(1))
                result.append("\n" if line.endswith("\n") else "")
            else:
                pattern = re.compile("(" + tick + r"+)(.*?)\1")
                result.append(pattern.sub(lambda m: " " * len(m.group()), line))
        return "".join(result)

    @staticmethod
    def inline_destinations(text: str):
        """Yield destinations from ordinary Markdown links and image links."""
        start_pattern = re.compile(r"(?<!\\)!?\[[^\]\n]*\]\(")
        for match in start_pattern.finditer(text):
            position = match.end()
            while position < len(text) and text[position].isspace():
                position += 1
            if position >= len(text):
                continue
            if text[position] == "<":
                end = text.find(">", position + 1)
                if end >= 0:
                    yield text[position + 1:end], text.count("\n", 0, match.start()) + 1
                continue
            depth, characters = 0, []
            while position < len(text):
                char = text[position]
                if char == "\\" and position + 1 < len(text):
                    characters.append(text[position + 1])
                    position += 2
                    continue
                if char == "(":
                    depth += 1
                elif char == ")":
                    if depth == 0:
                        break
                    depth -= 1
                elif char.isspace() and depth == 0:
                    break
                characters.append(char)
                position += 1
            if characters:
                yield "".join(characters), text.count("\n", 0, match.start()) + 1

    def check_link(self, destination: str, note: Path, line: int) -> None:
        where = f"{self.label(note)}:{line}"
        if not destination or destination.startswith("#"):
            return
        try:
            parsed = urlsplit(destination)
        except ValueError as exc:
            self.error("INVALID_LINK", where, str(exc))
            return
        if parsed.scheme.lower() in ("http", "https", "mailto"):
            self.counts["external_links_ignored"] += 1
            return
        if parsed.scheme or parsed.netloc:
            self.error("NONPORTABLE_LINK", where, destination)
            return
        path_text = unquote(parsed.path)
        if not path_text:
            return
        self.counts["markdown_links_checked"] += 1
        path = self.local_path(path_text, where, note.parent)
        if path is not None and not path.exists():
            self.error("BROKEN_MARKDOWN_LINK", where, destination)

    def check_wikilink(self, target: str, note: Path, line: int) -> None:
        where = f"{self.label(note)}:{line}"
        target = unquote(target.split("|", 1)[0].split("#", 1)[0].strip())
        if not target:
            return
        self.counts["wikilinks_checked"] += 1
        if target in self.nodes and target not in self.note_names:
            self.error("UNRESOLVED_ID_PLACEHOLDER", where, "[[" + target + "]]")
            return
        candidates: set[Path] = set(self.note_names.get(target, set()))
        for value in (target, target if Path(target).suffix else target + ".md"):
            for base in (note.parent, self.vault):
                path = self.local_path(value, where, base)
                if path is not None and path.is_file():
                    candidates.add(path)
        if not candidates:
            self.error("UNRESOLVED_WIKILINK", where, "[[" + target + "]]")
        elif len(candidates) > 1:
            self.error("AMBIGUOUS_WIKILINK", where, "[[" + target + "]]")

    def check_markdown(self) -> None:
        for node_id, path in self.node_paths.items():
            if not path.is_file():
                continue
            try:
                text = path.read_text(encoding="utf-8-sig")
            except (OSError, UnicodeError) as exc:
                self.error("NODE_READ_ERROR", self.label(path), str(exc))
                continue
            found_id = self.frontmatter_id(text)
            if found_id is None:
                self.error("MISSING_FRONTMATTER_ID", self.label(path),
                           "Node must start with frontmatter containing a nonempty id.")
            elif found_id != node_id:
                self.error("FRONTMATTER_ID_MISMATCH", self.label(path),
                           f"Graph id={node_id!r}; frontmatter id={found_id!r}.")
            if path in self.archive_paths:
                continue
            if path.suffix.lower() != ".md":
                self.error("NODE_FORMAT", self.label(path),
                           "Generated graph nodes must be Markdown notes.")
                continue
            self.counts["generated_markdown_nodes"] += 1
            visible = self.visible_markdown(text)
            for destination, line in self.inline_destinations(visible):
                self.check_link(destination, path, line)
            # Reference definitions are destinations, whether used once or many times.
            for match in re.finditer(r"^ {0,3}\[[^\]\n]+\]:[ \t]*(<[^>\n]+>|\S+)",
                                     visible, re.M):
                destination = match.group(1).strip("<>")
                self.check_link(destination, path, visible.count("\n", 0, match.start()) + 1)
            for match in re.finditer(r"(?<!\\)\[\[([^\]\n]+)\]\]", visible):
                self.check_wikilink(match.group(1), path,
                                    visible.count("\n", 0, match.start()) + 1)

    def check_canvas(self) -> None:
        relative = "HIVE_Research_Map.canvas"
        canvas = self.read_json(relative)
        if not isinstance(canvas, dict):
            if canvas is not None:
                self.error("CANVAS_SCHEMA", relative, "Canvas must be an object.")
            return
        nodes, edges = canvas.get("nodes"), canvas.get("edges")
        if not isinstance(nodes, list) or not isinstance(edges, list):
            self.error("CANVAS_SCHEMA", relative, "nodes and edges must be arrays.")
            return
        self.counts["canvas_nodes"], self.counts["canvas_edges"] = len(nodes), len(edges)
        node_ids: set[str] = set()
        all_ids: set[str] = set()
        for index, node in enumerate(nodes):
            where = f"{relative}:nodes[{index}]"
            if not isinstance(node, dict):
                self.error("CANVAS_SCHEMA", where, "Node must be an object.")
                continue
            node_id = node.get("id")
            if not isinstance(node_id, str) or not node_id.strip():
                self.error("CANVAS_SCHEMA", where, "Node id must be nonempty.")
            elif node_id in all_ids:
                self.error("DUPLICATE_CANVAS_ID", where, node_id)
            else:
                node_ids.add(node_id)
                all_ids.add(node_id)
            if node.get("type") == "file":
                path = self.local_path(node.get("file"), where)
                if path is not None and not path.is_file():
                    self.error("MISSING_CANVAS_FILE", where, self.label(path))
        for index, edge in enumerate(edges):
            where = f"{relative}:edges[{index}]"
            if not isinstance(edge, dict):
                self.error("CANVAS_SCHEMA", where, "Edge must be an object.")
                continue
            edge_id = edge.get("id")
            if not isinstance(edge_id, str) or not edge_id.strip():
                self.error("CANVAS_SCHEMA", where, "Edge id must be nonempty.")
            elif edge_id in all_ids:
                self.error("DUPLICATE_CANVAS_ID", where, edge_id)
            else:
                all_ids.add(edge_id)
            for field in ("fromNode", "toNode"):
                value = edge.get(field)
                if not isinstance(value, str) or value not in node_ids:
                    self.error("INVALID_CANVAS_REFERENCE", where, f"{field}={value!r}")

    def run(self) -> dict:
        if not self.vault.is_dir():
            self.error("MISSING_VAULT", self.vault, "Vault directory does not exist.")
        else:
            self.check_archive()
            self.check_graph()
            self.check_markdown()
            self.check_canvas()
        return {
            "ok": not self.errors,
            "vault": str(self.vault),
            "counts": self.counts,
            "error_count": len(self.errors),
            "errors": self.errors,
        }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "vault", nargs="?", type=Path,
        default=Path(__file__).resolve().parent.parent,
        help="Vault root; defaults to the directory above this script's tools folder.",
    )
    parser.add_argument(
        "--output-json", nargs="?", const="-", metavar="PATH",
        help="Write the report as JSON. Omit PATH or use '-' for standard output.",
    )
    args = parser.parse_args()
    report = Validator(args.vault).run()
    if args.output_json:
        serialized = json.dumps(report, indent=2, ensure_ascii=False) + "\n"
        if args.output_json == "-":
            print(serialized, end="")
        else:
            output = Path(args.output_json)
            try:
                output.parent.mkdir(parents=True, exist_ok=True)
                output.write_text(serialized, encoding="utf-8")
            except OSError as exc:
                print(f"Could not write JSON report: {exc}", file=sys.stderr)
                return 2
            print(f"{'PASS' if report['ok'] else 'FAIL'}: {report['error_count']} errors; "
                  f"report written to {output}")
    else:
        print(f"{'PASS' if report['ok'] else 'FAIL'}: {report['vault']}")
        for key, value in report["counts"].items():
            print(f"  {key}: {value}")
        for error in report["errors"]:
            print(f"  [{error['code']}] {error['path']}: {error['message']}")
        print(f"Errors: {report['error_count']}")
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
