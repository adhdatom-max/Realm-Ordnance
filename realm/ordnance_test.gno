package realmordnance

import (
    "strings"
    "testing"
)

func TestPublishedSnapshotAndStaging(cur realm, t *testing.T) {
    owner = address("g138mdf0gqzue3ra2r335upclngn8t8r0n72cn3h")
    testing.SetRealm(testing.NewUserRealm(owner))
    Begin(cross(cur), "Onyx 5000 blocks", "2026-11-24")
    AddDistricts(cross(cur), "defi,100,200,80\ngames,-100,0,30")
    AddPlots(cross(cur), "gno.land/r/demo/peak,defi,Peak,100,22,20,4,-7,recent")
    Publish(cross(cur))
    if !strings.Contains(Render("data/plots"), "Peak,100,104,193,recent,22,20,100,Castle") { t.Fatal(Render("data/plots")) }
    if !strings.Contains(Render("games"), "Open ground") { t.Fatal(Render("games")) }
    Begin(cross(cur), "New scan", "2026-11-25")
    AddDistricts(cross(cur), "tools,0,0,50")
    AddPlots(cross(cur), "gno.land/r/demo/tool,tools,Tool,1,1,1,0,0,new")
    if !strings.Contains(Render("data/plots"), "Peak,100") || strings.Contains(Render("data/plots"), "Tool,1") { t.Fatal("staged map leaked") }
    Publish(cross(cur))
    if !strings.Contains(Render("data/plots"), "Tool,1") || strings.Contains(Render("data/plots"), "Peak,100") { t.Fatal("map was not swapped") }
}

func TestSettlementThresholds(t *testing.T) {
    if Settlement(Plot{Callers: 1, Blocks: 1}) != "Cottage" { t.Fatal("cottage") }
    if Settlement(Plot{Callers: 5, Blocks: 3}) != "Village" { t.Fatal("village") }
    if Settlement(Plot{Callers: 20, Blocks: 15}) != "Castle" { t.Fatal("castle") }
}
