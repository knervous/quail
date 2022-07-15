package mod

import (
	"fmt"
	"os"
	"testing"

	"github.com/xackery/quail/dump"
)

func TestLoad(t *testing.T) {
	if os.Getenv("SINGLE_TEST") != "1" {
		return
	}
	path := "test/eq/_steamfontmts.eqg/"
	inFile := "test/eq/_steamfontmts.eqg/obj_gears.mod"
	f, err := os.Open(inFile)
	if err != nil {
		t.Fatalf("%s", err)
	}
	defer f.Close()
	d, err := dump.New("obj_gears.mod")
	if err != nil {
		t.Fatalf("dump.new: %s", err)
	}
	defer d.Save(fmt.Sprintf("%s.png", inFile))

	e, err := New("out", path)
	if err != nil {
		t.Fatalf("new: %s", err)
	}
	err = e.Load(f)
	if err != nil {
		t.Fatalf("load: %s", err)
	}
}

func TestLoadSaveLoad(t *testing.T) {
	if os.Getenv("SINGLE_TEST") != "1" {
		return
	}
	path := "test/"
	inFile := "test/obj_gears.mod"
	outFile := "test/obj_gears_loadsaveload.mod"
	f, err := os.Open(inFile)
	if err != nil {
		t.Fatalf("%s", err)
	}
	defer f.Close()
	d, err := dump.New(path)
	if err != nil {
		t.Fatalf("dump.new: %s", err)
	}

	e, err := New("out", path)
	if err != nil {
		t.Fatalf("new: %s", err)
	}
	err = e.Load(f)
	if err != nil {
		t.Fatalf("load: %s", err)
	}
	w, err := os.Create(outFile)
	if err != nil {
		t.Fatalf("create: %s", err)
	}
	defer w.Close()
	err = e.Save(w)
	if err != nil {
		t.Fatalf("save: %s", err)
	}
	d.Save(fmt.Sprintf("%s.png", outFile))
	dump.Close()

	r, err := os.Open(outFile)
	if err != nil {
		t.Fatalf("open: %s", err)
	}
	err = e.Load(r)
	if err != nil {
		t.Fatalf("load: %s", err)
	}
}

func TestLoadSaveGLTF(t *testing.T) {
	if os.Getenv("SINGLE_TEST") != "1" {
		return
	}
	path := "test/"
	inFile := "test/obj_gears.mod"
	outFile := "test/obj_gears_loadsavegtlf.gltf"

	f, err := os.Open(inFile)
	if err != nil {
		t.Fatalf("%s", err)
	}
	defer f.Close()
	d, err := dump.New(inFile)
	if err != nil {
		t.Fatalf("dump.new: %s", err)
	}

	e, err := New("out", path)
	if err != nil {
		t.Fatalf("new: %s", err)
	}
	err = e.Load(f)
	if err != nil {
		t.Fatalf("load: %s", err)
	}

	w, err := os.Create(outFile)
	if err != nil {
		t.Fatalf("create gltf: %s", err)
	}
	defer w.Close()

	err = e.GLTFExport(w)
	if err != nil {
		t.Fatalf("save: %s", err)
	}
	d.Save(fmt.Sprintf("%s.png", outFile))
	dump.Close()
}