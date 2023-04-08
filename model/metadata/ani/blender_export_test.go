package ani

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"testing"

	"github.com/xackery/quail/pfs/eqg"
)

func TestANI_BlenderExport(t *testing.T) {
	eqPath := os.Getenv("EQ_PATH")
	if eqPath == "" {
		t.Skip("EQ_PATH not set")
	}
	tests := []struct {
		name    string
		eqgPath string
		dstDir  string
		wantErr bool
	}{
		{name: "steamfontmts", eqgPath: fmt.Sprintf("%s/steamfontmts.eqg", eqPath), dstDir: "test/", wantErr: false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			pfs, err := eqg.NewFile(tt.eqgPath)
			if err != nil {
				t.Fatalf("failed to open eqg file: %s", err.Error())
			}

			for _, fe := range pfs.Files() {
				if filepath.Ext(fe.Name()) != ".ani" {
					continue
				}
				e, err := New(fe.Name(), pfs)
				if err != nil {
					t.Fatalf("failed to create ani: %s", err.Error())
				}

				err = e.Decode(bytes.NewReader(fe.Data()))
				if err != nil {
					t.Fatalf("failed to decode ter: %s", err.Error())
				}

				if err := e.BlenderExport(tt.dstDir); (err != nil) != tt.wantErr {
					t.Errorf("TER.BlenderExport() error = %v, wantErr %v", err, tt.wantErr)
				}
				break
			}
		})
	}
}