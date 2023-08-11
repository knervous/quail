// wld contains EverQuest fragments for various data
package wld

import (
	"bytes"
	"fmt"

	"github.com/xackery/quail/model/geo"
	"github.com/xackery/quail/pfs/archive"
	"github.com/xackery/quail/quail/def"
)

// WLD is a wld file struct
type WLD struct {
	archive         archive.ReadWriter
	version         uint32
	name            string
	meshManager     *geo.MeshManager
	materialManager *geo.MaterialManager
	particleManager *geo.ParticleManager
	names           map[int32]string    // used temporarily while decoding a wld
	Fragments       map[int]interface{} // used temporarily while decoding a wld
	isOldWorld      bool                // if true, impacts how fragments are loaded
	packs           map[int32]*encoderdecoder
	meshes          []*def.Mesh
}

// New creates a new empty instance. Use NewFile to load an archive file on creation
func New(name string, pfs archive.ReadWriter) (*WLD, error) {
	e := &WLD{
		name:            name,
		archive:         pfs,
		materialManager: geo.NewMaterialManager(),
		meshManager:     geo.NewMeshManager(),
		particleManager: geo.NewParticleManager(),
		Fragments:       make(map[int]interface{}),
	}
	e.packs = e.initPacks()
	return e, nil
}

// NewFile creates a new instance and loads provided file
func NewFile(name string, pfs archive.ReadWriter, file string) (*WLD, error) {
	e := &WLD{
		name:            name,
		archive:         pfs,
		materialManager: geo.NewMaterialManager(),
		meshManager:     geo.NewMeshManager(),
		particleManager: geo.NewParticleManager(),
		Fragments:       make(map[int]interface{}),
	}
	e.packs = e.initPacks()
	data, err := pfs.File(file)
	if err != nil {
		return nil, fmt.Errorf("file '%s': %w", file, err)
	}
	err = e.Decode(bytes.NewReader(data))
	if err != nil {
		return nil, fmt.Errorf("decode: %w", err)
	}
	return e, nil
}

// Name returns the name of the archive
func (e *WLD) Name() string {
	return e.name
}

// Meshes returns the meshes
func (e *WLD) Meshes() []*def.Mesh {
	return e.meshes
}

// Names returns the names
func (e *WLD) Names() map[int32]string {
	return e.names
}
