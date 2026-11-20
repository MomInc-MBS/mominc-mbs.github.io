---
id: "M05"
title: "Fungal transport and Physarum network design"
type: "metaphor"
status: "software_translation_proposed"
evidence_status: "primary_observation_linked"
implementation_status: "software_translation_proposed"
created: "2026-11-20"
tags:
  - hive
  - hive/metaphor
---

# Fungal transport and Physarum network design

- **Observed mechanisms:** Heaton and colleagues linked modeled flow in growing fungal networks with later cord enlargement. Separately, Tero and colleagues studied adaptive transport networks formed by Physarum, a slime mold.
- **Software translation — proposal:** Assign graph edges measurable costs and benefits: validated usefulness, queue pressure, latency, redundancy, and loading cost. Update route strength from observed traffic and successful outcomes while retaining rarely used recovery routes.
- **Competing branches:** Fixed graph; demand-reinforced graph; explicit global graph optimization; redundant routes maintained for resilience. Distinguish fungal flow adaptation from the separate Physarum network-design model.
- **Falsifiable experiment:** Under matched message and compute budgets, change demand, disable nodes, introduce congestion, and supply stale information. Compare valid completion and recovery. Demand reinforcement fails if it amplifies traffic without improving useful work or fault tolerance.
- **Analogy limit:** Software lacks the physical pressure coupling of a fluid network. The substitute signal must be defined and measured; Physarum must not be mislabeled a fungus.
- **Adjacent avenues:** Network flow, congestion control, adaptive routing, graph sparsification, and resilient infrastructure design.

## Primary source trail

[Growth-induced mass flows in fungal networks](../60_Sources/S22_Growth_induced_mass_flows_in_fungal_networks.md) · [Rules for biologically inspired adaptive network design](../60_Sources/S23_Rules_for_biologically_inspired_adaptive_network_design.md)

## Research connections

[Coordination and supervision](../10_Research/T03_Coordination/T03_Coordination.md) · [Biology and physical translation](../10_Research/T10_Research/P33_Biology_and_physical_translation.md)
