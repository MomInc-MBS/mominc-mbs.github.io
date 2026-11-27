# C5 lifecycle (C:\hive-work\demo\c5-c9681d6)

counters start {'experiments': 0, 'model_calls': 0, 'proposal_calls': 0, 'container_runs': 0, 'discovery_ledger_calls': 0}
counters end {'experiments': 4, 'model_calls': 0, 'proposal_calls': 0, 'container_runs': 4, 'discovery_ledger_calls': 0}

## site.ref-extract
- v1: {'cap_id': 'site.ref-extract', 'version': 1, 'statement_sha': '7129a81316dc9524d2789ad3f71a52718991d72447149116fe4ac08b817e75e6', 'event_ref': 'artifacts/658bf807d6224c29442dc2c24fe0c8e90f5bb5d9fcbe2c9385afaefcd45db056.json', 'rerun_receipt_sha256': 'd600452c825576b109935065a731812994c58571182f55abd804188017936691', 'route': 'operator-authored'}
- v2 site.ref-extract.r1.hosted: ADMIT_REFUSED admission refused: check: the capability already has an admitted version: only an explicit improvement can add another
- reuse verified: True (version 1)
- comparison: {'a_authored_v1_body_separate_run_identical': True, 'authored_sha256': 'fafea1c9b99e08eaead20ed0e71982b12b40ccfdf722cfbcf664a9cac689f5bc', 'b_shipped_export': 'raw-reference-table-0b3854a.json', 'b_shipped_identical': True, 'shipped_sha256': 'fafea1c9b99e08eaead20ed0e71982b12b40ccfdf722cfbcf664a9cac689f5bc', 'goal_output_sha256': 'fafea1c9b99e08eaead20ed0e71982b12b40ccfdf722cfbcf664a9cac689f5bc'}
- not-a-cache: output differs True, verified True
- rollback: {'refused': 'site.ref-extract: no earlier admitted, unrevoked version to roll back to (only: [1])'}

## site.ref-resolve
- v1: {'cap_id': 'site.ref-resolve', 'version': 1, 'statement_sha': '013de988f42dc15264c3ed993695ec5aed889f6cbaf27456812183259e60b87d', 'event_ref': 'artifacts/d71711bd9a7b4224452ef95393a005274ee3ef03b95f769200d6f553ac7b1b13.json', 'rerun_receipt_sha256': 'a04d7252a50545efa77bb8845110a274e3a6d603566b1319b15de37e2b6bf185', 'route': 'operator-authored'}
- v2 site.ref-resolve.r1.hosted: ADMIT_REFUSED admission refused: check: the capability already has an admitted version: only an explicit improvement can add another
- reuse verified: True (version 1)
- comparison: {'a_authored_v1_body_separate_run_identical': True, 'authored_sha256': '0cb3548174f5165c4cfb83c146b68fbd1fdaeafb7b4f335c40b240e5692df932', 'b_shipped_export': 'reference-table-0b3854a.json', 'b_shipped_identical': True, 'shipped_sha256': '0cb3548174f5165c4cfb83c146b68fbd1fdaeafb7b4f335c40b240e5692df932', 'goal_output_sha256': '0cb3548174f5165c4cfb83c146b68fbd1fdaeafb7b4f335c40b240e5692df932'}
- not-a-cache: output differs True, verified True
- rollback: {'refused': 'site.ref-resolve: no earlier admitted, unrevoked version to roll back to (only: [1])'}

## Learned-first (c5l store)
store C:\hive-work\demo\c5l-c9681d6; counters start {'experiments': 0, 'model_calls': 0, 'proposal_calls': 0, 'container_runs': 0, 'discovery_ledger_calls': 0} end {'experiments': 2, 'model_calls': 0, 'proposal_calls': 0, 'container_runs': 4, 'discovery_ledger_calls': 0}
authored v1 reuse VERIFIED in the c5-c9681d6 store above (the existing route)

### site.ref-extract
- v1: ADMITTED {'version': 1, 'route': 'learned', 'sealed_final': {'body_sha256': 'c37ca70bf5da19e70ff26370fe45dc4d8b75084173a10743ca02d6762f7f5e48', 'campaign_exp_id': 'd-bd3b207fd6571a0e43bf', 'campaign_frozen_sha': 'bd3b207fd6571a0e43bf1251673824dce1b7be6a24727755ef4aeed381315899', 'proposer_model': 'nvidia/nemotron-3.5-super-vl-120b-a12b', 'receipt_sha256': '16901d5604b5a2ed6da8914ae7db64a66214344031ea78d54ec52fb4b5196b50', 'screen': 'backend_screen_v1'}, 'proposer_model': 'nvidia/nemotron-3.5-super-vl-120b-a12b'}
- reuse verified: True
- comparison: {'a_authored_body_separate_run_identical': True, 'b_shipped_export': 'raw-reference-table-0b3854a.json', 'b_shipped_identical': True, 'goal_output_sha256': 'fafea1c9b99e08eaead20ed0e71982b12b40ccfdf722cfbcf664a9cac689f5bc', 'authored_sha256': 'fafea1c9b99e08eaead20ed0e71982b12b40ccfdf722cfbcf664a9cac689f5bc', 'shipped_sha256': 'fafea1c9b99e08eaead20ed0e71982b12b40ccfdf722cfbcf664a9cac689f5bc'}
- not-a-cache: differs True, verified True
- revoke: {'cap_id': 'site.ref-extract', 'type': 'revoke', 'event_ref': 'artifacts/be6c02fa3f80253ab2ccab73e15ee5c8443ce4db4ea516fc46dc23b05d78ff1c.json', 'version': 1, 'reason': 'C5 revocation test'}
- post-revoke goal: UNRESOLVED / no typed plan from the eligible capabilities

### site.ref-resolve
- v1: ADMITTED {'version': 1, 'route': 'learned', 'sealed_final': {'body_sha256': '3afae2449e296cad54e6b3b527ce6df2702b54a2adf598171eb6b1e4221ce24a', 'campaign_exp_id': 'd-7be3aff27902c1a17300', 'campaign_frozen_sha': '7be3aff27902c1a1730073066430dc7dc5c6dc735ba3c4618ba3437ae2908e29', 'proposer_model': 'nvidia/nemotron-3.5-super-vl-120b-a12b', 'receipt_sha256': '4461f7803856afacf7501aa4281df28180ce0f015654f843c0384111698b69c9', 'screen': 'backend_screen_v1'}, 'proposer_model': 'nvidia/nemotron-3.5-super-vl-120b-a12b'}
- reuse verified: True
- comparison: {'a_authored_body_separate_run_identical': True, 'b_shipped_export': 'reference-table-0b3854a.json', 'b_shipped_identical': True, 'goal_output_sha256': '0cb3548174f5165c4cfb83c146b68fbd1fdaeafb7b4f335c40b240e5692df932', 'authored_sha256': '0cb3548174f5165c4cfb83c146b68fbd1fdaeafb7b4f335c40b240e5692df932', 'shipped_sha256': '0cb3548174f5165c4cfb83c146b68fbd1fdaeafb7b4f335c40b240e5692df932'}
- not-a-cache: differs True, verified True
- revoke: {'cap_id': 'site.ref-resolve', 'type': 'revoke', 'event_ref': 'artifacts/03da754718507e0470c2e5700ad45d971925a3915146a5b1ffa8077ac72c5f96.json', 'version': 1, 'reason': 'C5 revocation test'}
- post-revoke goal: UNRESOLVED / no typed plan from the eligible capabilities
