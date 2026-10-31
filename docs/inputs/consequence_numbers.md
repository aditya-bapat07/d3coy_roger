# Navanagar consequence numbers

Navanagar is a fictional Indian city of about 5 lakh (500,000) people. Every value here is shown in the app labelled "Scenario assumption"; none is a real statistic.

Severity scale: 0 none · 1 inconvenience · 2 economic harm · 3 health risk · 4 potential loss of life.

## Counting rules (the engine must follow these)

1. **Each buffer is applied once**, as failure_delay_hours on the dependency edge. The Backup column only explains where a delay comes from; it is not added again at the node.
2. **A downstream service is hit only if the upstream outage lasts longer than the delay.** Its outage = upstream outage − delay.
3. **If the backup generator controller is compromised**, the delay on Feeder substation → District hospital drops from 24 h to 0 h. The controller has no dependency edge of its own, because on its own it stops nothing.
4. **People affected = the largest people_served among the services lost, not the sum.** The populations overlap: the north power zone lies inside the water plant's service area, and the hospital and traffic figures are drawn from the same city.

## Services

| Service node | Site | people_served | safety_severity | baseline_outage_hours (if compromised) | Backup (explains the delays below) | Reason |
|---|---|---|---|---|---|---|
| Feeder substation SS-2 (33/11 kV) | Power | 120,000 | 3 | 12 | None at the substation | Feeds the north zone (about a quarter of the city) plus the water plant, the hospital and the signal network. Long outages are a health risk in heat and for people on home oxygen or other powered equipment. 12 h covers inspecting relays and breakers and restoring manually after a cyber incident. |
| Residential power, North zone | Power | 120,000 | 2 | 12 (follows substation) | Inverters in some homes (not counted) | Mainly economic and daily-life disruption; the health risk is scored on the substation and hospital rows, so it is not counted twice. |
| Water treatment plant, pumping (27 MLD) | Water | 200,000 | 3 | 24 | Plant DG set runs controls and SCADA only, not the main pumps | 27 MLD = 2 lakh people × 135 litres per person per day, the CPHEEO norm for cities with sewerage. 24 h covers a safe pump restart and water-quality checks before supply resumes. |
| Chlorine dosing | Water | 200,000 | 4 | 72 | Online residual-chlorine alarm; manual sampling | Under-dosing risks a waterborne disease outbreak; over-dosing makes water unsafe to drink. 72 h covers flushing mains, cleaning storage tanks, lab tests and lifting a boil-water notice. |
| Reservoir level monitoring | Water | 200,000 | 2 | 8 | Manual level readings by plant staff | False readings cause overflow or pumps running dry; costly and disruptive, but staff can switch to manual readings within a shift. |
| Piped water supply, plant service area | Water | 200,000 | 3 | 24 | Service reservoirs + household overhead tanks and sumps | Piped water in Indian cities runs about four hours a day on average (IWA, The Source, 2021), so households store it, and the buffer is about half a day on average. A hydraulic check on an EPANET example network shows network storage alone lasts about 8 h, so household storage supplies the rest. Informal settlements with little storage are hit at the first missed slot, so the average understates their risk. |
| District hospital (300 beds, 20 ICU) | Hospital | 500,000 | 4 | 12 | Diesel generator 24 h; overhead water tanks 12 h; UPS 30 min on critical loads | Navanagar's only public district hospital and main emergency centre, so the whole city is its emergency catchment (private hospitals exist but are not modelled), with 300 inpatients at direct risk on site. ICU, ventilators and theatres make loss of power potentially fatal. |
| Hospital building management system | Hospital | 300 | 3 | 8 | Manual override of air-handling units | Controls theatre and ICU air handling; failure postpones surgeries and raises infection risk for inpatients. It degrades care but does not shut the hospital, so it has no edge to the hospital node. |
| Medical-device IoT gateway | Hospital | 40 | 3 | 12 | Bedside device alarms + nurse rounds | 40 = ICU and high-dependency beds on central monitoring. Bedside devices keep working, so this is a health risk, not an immediate loss of life, and it does not shut the hospital. |
| Backup generator controller | Hospital | 300 | 1 | 6 | Manual start by on-site electrician, about 30 min | Alone, nothing visible happens. Its real consequence is removing the hospital's 24 h power buffer (rule 3), which makes a grid outage potentially fatal. |
| Traffic signal controller (60 junctions) | City | 150,000 | 3 | 6 | UPS at major junctions about 2 h; traffic police manual control within about 1 h | Daily commuters through signalised junctions. Dark or manipulated signals raise crash risk and delay ambulances. |
| IoT camera gateway (city surveillance) | City | 0 | 1 | 24 | Local recording on cameras, about 72 h | Live monitoring is lost but no public service stops, so no one loses a service directly. A compromise is also a personal-data exposure under the Digital Personal Data Protection Act, 2023, which this physical-severity scale does not score. |

## Dependencies

| From | To | Type | failure_delay_hours | Reason |
|---|---|---|---|---|
| Feeder substation SS-2 | Residential power, North zone | powers | 0 | Homes lose power when the feeder trips. |
| Feeder substation SS-2 | Water treatment plant, pumping | powers | 0 | Main pumps trip at once; the plant DG set keeps only controls alive. |
| Feeder substation SS-2 | District hospital | powers | 24 | Diesel generator runtime. Drops to 0 if the generator controller is compromised (rule 3). |
| Feeder substation SS-2 | Traffic signal controller | powers | 0 | Most junctions go dark at once; UPS covers only major junctions, so 0 is the network-wide value. |
| Feeder substation SS-2 | IoT camera gateway | powers | 0 | Gateway goes down at once; cameras keep recording locally. |
| Water treatment plant, pumping | Piped water supply, plant service area | supplies_water | 12 | Service reservoirs plus household storage cover about half a day. |
| Chlorine dosing | Piped water supply, plant service area | supplies_water | 3 | Storage gives no protection here: wrongly dosed water reaches taps through the contact tank and mains in about 3 h, and fills household tanks. |
| Reservoir level monitoring | Water treatment plant, pumping | monitors | 2 | With false readings, pumps run blind; overflow or dry-running damage builds up within about 2 h. |
| Piped water supply, plant service area | District hospital | supplies_water | 12 | Hospital overhead tanks and sumps cover about 12 h; tankers can be arranged after that. |

## Worked check (what the rules produce)

- **Substation alone (12 h outage):** north zone power, water pumping, traffic signals and the camera gateway are out for 12 h. Household water is not cut, because the 12 h pumping outage does not exceed the 12 h storage buffer. The hospital is not hit, because 12 h is less than its 24 h generator buffer.
- **Substation + generator controller:** the hospital buffer drops to 0, so the hospital loses power for the full 12 h. This is the strongest attack story for the demo: neither compromise alone touches the hospital, but together they cut its power at once. (By the weights in assumptions.json, chlorine dosing still has the highest consequence of any single asset: 1.00 against 0.83 here.)
- **Chlorine dosing:** unsafe water reaches 2 lakh people after 3 h and stays unsafe for 69 h (72 − 3). The hospital's 12 h of stored water then runs out, so it is hit from hour 15 (3 + 12) for 57 h (69 − 12). Two essential services fail: piped water and the hospital.

## Deliberately not modelled (say so if asked)

- Restoring power by switching load to an adjacent substation, which would shorten outages; leaving it out keeps the numbers conservative.
- Sewage pumping stations, which would overflow during long power cuts.
- Telecom networks.
- Partial contamination: unsafe water is treated exactly like lost supply, so the hospital is hit once its 12 h of clean stored water runs out. Real contamination events vary in extent.
- The link from traffic-signal failure to slower ambulance arrival at the hospital.
