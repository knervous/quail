package mod

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"testing"

	"github.com/xackery/quail/eqg"
)

func TestGLTFExportSamplesSingleTest(t *testing.T) {
	if os.Getenv("SINGLE_TEST") != "1" {
		return
	}
	tests := []struct {
		category string
	}{
		{category: "steamfontmts"},
		//{category: "arthwall"},
		//{category: "aro"},
		//{category: "she"},
		//{category: "voaequip"},
	}
	for _, tt := range tests {

		eqgFile := fmt.Sprintf("test/eq/%s.eqg", tt.category)
		//modFile := fmt.Sprintf("obj_%s.mod", tt.category)

		//outFile := fmt.Sprintf("test/eq/%s_mod.gltf", tt.category)
		//txtFile := fmt.Sprintf("test/eq/%s_mod.txt", tt.category)

		ra, err := os.Open(eqgFile)
		if err != nil {
			t.Fatalf("%s", err)
		}
		defer ra.Close()
		a, err := eqg.New(tt.category)
		if err != nil {
			t.Fatalf("eqg.New: %s", err)
		}
		err = a.Load(ra)
		if err != nil {
			t.Fatalf("load eqg: %s", err)
		}

		files := a.Files()
		for _, modEntry := range files {
			if filepath.Ext(modEntry.Name()) != ".mod" {
				continue
			}
			r := bytes.NewReader(modEntry.Data())

			e, err := NewEQG(tt.category, a)
			if err != nil {
				t.Fatalf("new: %s", err)
			}

			err = e.Load(r)
			if err != nil {
				t.Fatalf("load %s: %s", modEntry.Name(), err)
			}

			/*			fw, err := os.Create(txtFile)
						if err != nil {
							t.Fatalf("%s", err)
						}
						defer fw.Close()
						fmt.Fprintf(fw, "faces:\n")
						for i, o := range e.faces {
							fmt.Fprintf(fw, "%d %+v\n", i, o)
						}

						fmt.Fprintf(fw, "vertices:\n")
						for i, o := range e.vertices {
							fmt.Fprintf(fw, "%d pos: %0.0f %0.0f %0.0f, normal: %+v, uv: %+v\n", i, o.Position.X, o.Position.Y, o.Position.Z, o.Normal, o.Uv)
						}
			*/
			outFile := fmt.Sprintf("test/eq/%s_mod_%s.gltf", tt.category, modEntry.Name())
			w, err := os.Create(outFile)
			if err != nil {
				t.Fatalf("create %s", err)
			}
			defer w.Close()
			err = e.GLTFExport(w)
			if err != nil {
				t.Fatalf("save: %s", err)
			}
		}
	}
}

func TestGLTFExportSingleModel(t *testing.T) {
	if os.Getenv("SINGLE_TEST") != "1" {
		return
	}
	tests := []struct {
		category string
		model    string
	}{
		{category: "steamfontmts", model: "obj_gears.mod"},
		//{category: "arthwall"},
		//{category: "aro"},
		//{category: "she"},
		//{category: "voaequip"},
	}
	for _, tt := range tests {

		eqgFile := fmt.Sprintf("test/eq/%s.eqg", tt.category)
		//modFile := fmt.Sprintf("obj_%s.mod", tt.category)

		//outFile := fmt.Sprintf("test/eq/%s_mod.gltf", tt.category)
		//txtFile := fmt.Sprintf("test/eq/%s_mod.txt", tt.category)

		ra, err := os.Open(eqgFile)
		if err != nil {
			t.Fatalf("%s", err)
		}
		defer ra.Close()
		a, err := eqg.New(tt.category)
		if err != nil {
			t.Fatalf("eqg.New: %s", err)
		}
		err = a.Load(ra)
		if err != nil {
			t.Fatalf("load eqg: %s", err)
		}

		data, err := a.File(tt.model)
		if err != nil {
			t.Fatalf("file: %s", err)
		}

		e, err := NewEQG(tt.model, a)
		if err != nil {
			t.Fatalf("new: %s", err)
		}

		r := bytes.NewReader(data)
		err = e.Load(r)
		if err != nil {
			t.Fatalf("load %s: %s", tt.model, err)
		}

		outFile := fmt.Sprintf("test/eq/%s_mod_%s.gltf", tt.category, tt.model)
		w, err := os.Create(outFile)
		if err != nil {
			t.Fatalf("create %s", err)
		}
		defer w.Close()
		err = e.GLTFExport(w)
		if err != nil {
			t.Fatalf("save: %s", err)
		}
	}
}