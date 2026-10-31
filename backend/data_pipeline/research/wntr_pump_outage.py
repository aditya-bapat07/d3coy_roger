"""Hydraulic check of the water-storage buffer with WNTR (USEPA/WNTR, Revised BSD).
Network: EPANET example network Net3 shipped with WNTR (NOT Navanagar; used only to sanity-check the 12 h buffer).
Runs: baseline (normal operation) and a 72 h total pumping loss: both pumps and the River bypass pipe 330 held
closed, with Net3's 18 built-in pump/bypass controls removed. Those controls override WNTR's add_outage rule
(pump 335 kept running in a first attempt), so the outage is imposed by removing them; this is OUR modification.
Pressure-dependent demand.
Service measure: share of total expected demand actually delivered per hour (demand satisfaction).
Usage: python wntr_pump_outage.py <path to Net3.inp> <out.json>
"""
import json, sys
import wntr

inp, out = sys.argv[1], sys.argv[2]
REQUIRED_P = 17.0   # m, full demand delivered at or above this (CPHEEO residual-pressure norm for 3-storey supply)
MIN_P = 0.0         # m, no delivery at or below this
H = 72


def run(outage_hours, close_bypass=False):
    wn = wntr.network.WaterNetworkModel(inp)
    wn.options.time.duration = H * 3600
    wn.options.time.hydraulic_timestep = 3600
    wn.options.time.report_timestep = 3600
    wn.options.hydraulic.demand_model = "PDD"
    wn.options.hydraulic.required_pressure = REQUIRED_P
    wn.options.hydraulic.minimum_pressure = MIN_P
    if outage_hours and not close_bypass:
        for name in wn.pump_name_list:
            wn.get_link(name).add_outage(wn, 0, outage_hours * 3600)
    if close_bypass:
        # Pump-dependent mode: Net3's built-in time/tank-level controls (all of which switch pumps 10/335 or
        # pipe 330) re-open the pumps despite the outage rule, so remove them and hold pumps + bypass closed.
        from wntr.network import LinkStatus
        for c in list(wn.control_name_list):
            wn.remove_control(c)
        for name in wn.pump_name_list + ["330"]:
            link = wn.get_link(name)
            link.initial_status = LinkStatus.Closed
    expected = wntr.metrics.expected_demand(wn)
    res = wntr.sim.WNTRSimulator(wn).run_sim()
    delivered = res.node["demand"].loc[:, wn.junction_name_list]
    exp = expected.loc[delivered.index, wn.junction_name_list]
    ratio = (delivered.sum(axis=1) / exp.sum(axis=1)).fillna(1.0)
    p = res.node["pressure"].loc[:, wn.junction_name_list]
    users = [j for j in wn.junction_name_list if exp[j].sum() > 0]
    low = (p[users] < 7.0).mean(axis=1)   # share of demand junctions below 7 m (CPHEEO single-storey minimum)
    hours = [int(t // 3600) for t in ratio.index]
    first_below = lambda s, x: next((h for h, v in zip(hours, s) if v < x), None)
    return dict(
        outage_hours=outage_hours, pump_dependent_mode=close_bypass,
        min_tank_level_m={t: round(float((res.node["head"][t] - wn.get_node(t).elevation).min()), 2) for t in wn.tank_name_list},
        pump_flow_max_after_h0={p: round(float(abs(res.link["flowrate"][p].iloc[1:]).max()), 4) for p in wn.pump_name_list},
        pumps=wn.pump_name_list, tanks=wn.tank_name_list,
        hour_served_demand_below_90pct=first_below(ratio.values, 0.9),
        hour_served_demand_below_50pct=first_below(ratio.values, 0.5),
        min_served_demand_pct=round(100 * float(ratio.min()), 1),
        hour_majority_of_demand_nodes_below_7m=next((h for h, v in zip(hours, low.values) if v > 0.5), None),
        served_demand_pct_by_hour={h: round(100 * float(v), 1) for h, v in zip(hours, ratio.values)},
    )


results = {"network": "EPANET example network Net3 (shipped with WNTR); not Navanagar",
           "reading": "Network storage alone (Net3's 3 tanks, no household storage) keeps full service for about 7 h after all pumping stops; service collapses by hour 8-9. Navanagar's 12 h buffer assumes service reservoirs PLUS household overhead tanks and sumps, so storage alone giving ~8 h on a comparable network supports 12 h as plausible, not as proven.",
           "wntr_version": wntr.__version__, "required_pressure_m": REQUIRED_P, "minimum_pressure_m": MIN_P,
           "runs": [run(0), run(72, True)]}
json.dump(results, open(out, "w"), indent=1)
for r in results["runs"]:
    print({k: v for k, v in r.items() if k != "served_demand_pct_by_hour"})
