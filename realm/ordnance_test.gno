package realmordnance

import (
	"strings"
	"testing"
)

const testOwner = "g138mdf0gqzue3ra2r335upclngn8t8r0n72cn3h"

func TestPublishedSnapshotAndStaging(cur realm, t *testing.T) {
	owner = address(testOwner)
	testing.SetRealm(testing.NewUserRealm(owner))
	active = Snapshot{}
	pending = Snapshot{}
	staging = false
	Begin(cross(cur), "Onyx 5000 blocks", "2026-11-24")
	AddDistricts(cross(cur), "defi,100,200,80\ngames,-100,0,30")
	AddPlots(cross(cur), "gno.land/r/demo/peak,defi,Peak,100,22,20,4,-7,recent")
	Publish(cross(cur))
	if !strings.Contains(Render("data/plots"), "Peak,100,104,193,recent,22,20,100,Castle") {
		t.Fatal(Render("data/plots"))
	}
	if !strings.Contains(Render("games"), "Open ground") {
		t.Fatal(Render("games"))
	}
	Begin(cross(cur), "New scan", "2026-11-25")
	AddDistricts(cross(cur), "tools,0,0,50")
	AddPlots(cross(cur), "gno.land/r/demo/tool,tools,Tool,1,1,1,0,0,new")
	if !strings.Contains(Render("data/plots"), "Peak,100") || strings.Contains(Render("data/plots"), "Tool,1") {
		t.Fatal("staged map leaked")
	}
	Publish(cross(cur))
	if !strings.Contains(Render("data/plots"), "Tool,1") || strings.Contains(Render("data/plots"), "Peak,100") {
		t.Fatal("map was not swapped")
	}
}

func TestSettlementThresholds(t *testing.T) {
	if Settlement(Plot{Callers: 1, Blocks: 1}) != "Cottage" {
		t.Fatal("cottage")
	}
	if Settlement(Plot{Callers: 5, Blocks: 3}) != "Village" {
		t.Fatal("village")
	}
	if Settlement(Plot{Callers: 20, Blocks: 15}) != "Castle" {
		t.Fatal("castle")
	}
	if Settlement(Plot{Callers: 4, Blocks: 3}) != "Cottage" {
		t.Fatal("callers 4 is still a cottage")
	}
	if Settlement(Plot{Callers: 5, Blocks: 2}) != "Cottage" {
		t.Fatal("blocks 2 is still a cottage")
	}
	if Settlement(Plot{Callers: 19, Blocks: 15}) != "Village" {
		t.Fatal("callers 19 is a village, not a castle")
	}
	if Settlement(Plot{Callers: 20, Blocks: 14}) != "Village" {
		t.Fatal("blocks 14 is a village, not a castle")
	}
	if Settlement(Plot{Callers: 0, Blocks: 0}) != "Cottage" {
		t.Fatal("zero activity is a cottage")
	}
}

func TestSnapshotDataIntegrity(cur realm, t *testing.T) {
	owner = address(testOwner)
	testing.SetRealm(testing.NewUserRealm(owner))
	active = Snapshot{}
	pending = Snapshot{}
	staging = false
	if !strings.Contains(Render(""), "No published snapshot yet") {
		t.Fatal(Render(""))
	}
	Begin(cross(cur), "Onyx blocks 1449053-1454052", "2026-11-27")
	AddDistricts(cross(cur), "defi,100,200,80\nvalidators,-1259,0,92")
	AddDistricts(cross(cur), "games,-100,0,30")
	AddPlots(cross(cur), "gno.land/r/demo/peak,defi,Peak,100,22,20,4,-7,recent")
	AddPlots(cross(cur), "gno.land/r/gnoland/valopers,validators,Valopers,8,3,2,1,2,now\ngno.land/r/demo/quiet,games,Quiet,0,0,0,0,0,idle")
	if !strings.Contains(Render(""), "No published snapshot yet") {
		t.Fatal("unpublished staging leaked into Render")
	}
	Publish(cross(cur))

	overview := Render("")
	if !strings.Contains(overview, "Onyx blocks 1449053-1454052 (2026-11-27) — 3 realms across 3 islands") {
		t.Fatal(overview)
	}
	if !strings.Contains(overview, "validators") || !strings.Contains(Render("validators"), "Valopers") {
		t.Fatal("validators island missing")
	}

	districts := Render("data/districts")
	if !strings.Contains(districts, "defi,100,200,80,1") {
		t.Fatal(districts)
	}
	if !strings.Contains(districts, "validators,-1259,0,92,1") {
		t.Fatal(districts)
	}
	if !strings.Contains(districts, "games,-100,0,30,1") {
		t.Fatal(districts)
	}

	plots := Render("data/plots")
	if !strings.Contains(plots, "gno.land/r/demo/peak,defi,Peak,100,104,193,recent,22,20,100,Castle") {
		t.Fatal(plots)
	}
	if !strings.Contains(plots, "gno.land/r/gnoland/valopers,validators,Valopers,8,-1258,2,now,3,2,") {
		t.Fatal(plots)
	}
	if !strings.Contains(plots, "gno.land/r/demo/quiet,games,Quiet,0,-100,0,idle,0,0,0,Cottage") {
		t.Fatal(plots)
	}

	if Height(0) != 0 {
		t.Fatal("zero calls should have height 0")
	}
	if Height(100) != 100 {
		t.Fatalf("max calls should have height 100, got %d", Height(100))
	}
	if Height(8) != 28 {
		t.Fatalf("height(8) want 28, got %d", Height(8))
	}

	if !strings.Contains(Render("missing"), "Unknown island") {
		t.Fatal(Render("missing"))
	}
	if !strings.Contains(Render("games"), "Quiet") || !strings.Contains(Render("games"), "Cottage") {
		t.Fatal(Render("games"))
	}
}

func TestFieldValidationHelpers(t *testing.T) {
	if number("0") != 0 || number(" 22 ") != 22 {
		t.Fatal("number should parse integers")
	}
	var got any
	func() {
		defer func() { got = recover() }()
		_ = number("n")
	}()
	msg, _ := got.(string)
	if !strings.Contains(msg, "invalid number") {
		t.Fatalf("number should panic on junk, got %v", got)
	}

	if validName("") || validName("has,comma") || validName("has\nnl") || validName("has\rcr") {
		t.Fatal("validName should reject empty names and commas or newlines")
	}
	if !validName("Onyx 5000 blocks") || !validName("2026-11-27") {
		t.Fatal("validName should accept ordinary labels and dates")
	}
	long := strings.Repeat("a", 81)
	if validName(long) {
		t.Fatal("validName should reject names longer than 80 characters")
	}

	ds := []District{{Name: "defi"}, {Name: "validators"}}
	if !districtExists(ds, "defi") || districtExists(ds, "games") {
		t.Fatal("districtExists")
	}
	ps := []Plot{{Path: "gno.land/r/demo/peak"}}
	if !plotExists(ps, "gno.land/r/demo/peak") || plotExists(ps, "gno.land/r/demo/other") {
		t.Fatal("plotExists")
	}
}
