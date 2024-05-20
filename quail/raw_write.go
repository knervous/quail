package quail

import (
	"fmt"
	"path/filepath"
	"strings"

	"github.com/xackery/quail/common"
	"github.com/xackery/quail/raw"
)

func (e *Quail) RawWrite(out raw.Writer) error {
	if e == nil {
		return fmt.Errorf("quail is nil")
	}
	switch val := out.(type) {
	case *raw.Lay:
		return e.layWrite(val)
	case *raw.Wld:
		return e.wldWrite(val)
	default:
		return fmt.Errorf("unknown type %T", val)
	}
}

func RawWrite(out raw.Writer, e *Quail) error {
	if e == nil {
		return fmt.Errorf("quail is nil")
	}
	return e.RawWrite(out)
}

func (e *Quail) layWrite(lay *raw.Lay) error {
	if e == nil {
		return fmt.Errorf("quail is nil")
	}
	if lay == nil {
		return fmt.Errorf("layer is nil")
	}

	if e.Header == nil {
		e.Header = &common.Header{}
	}
	lay.Version = uint32(e.Header.Version)

	for _, model := range e.Models {
		for _, entry := range model.Layers {
			entry := &raw.LayEntry{
				Material: entry.Material,
				Diffuse:  entry.Diffuse,
				Normal:   entry.Normal,
			}

			lay.Entries = append(lay.Entries, entry)
		}
	}

	return nil
}

func (e *Quail) wldWrite(wld *raw.Wld) error {
	if wld == nil {
		return fmt.Errorf("wld is nil")
	}
	if wld.Fragments == nil {
		wld.Fragments = make(map[int]raw.FragmentReadWriter)
	}

	fragIndex := 1
	textureRefs := make(map[string]int)
	materials := make(map[string]int)

	// as per gfaydark_obj
	// every material has:
	//texturelist bminfo [x]
	//texture simplespritedef [ ]
	//textureref simplesprite
	//material materialdef

	for _, model := range e.Models {
		mesh := &raw.WldFragMesh{}

		materialList := &raw.WldFragMaterialList{}
		for _, srcMat := range model.Materials {
			matRef, ok := materials[srcMat.Name]
			if ok {
				materialList.MaterialRefs = append(materialList.MaterialRefs, uint32(matRef))
				continue
			}

			dstMat := &raw.WldFragMaterialDef{}
			for _, srcProp := range srcMat.Properties {
				if !strings.Contains(srcProp.Name, "texture") {
					continue
				}
				textureRef, ok := textureRefs[srcProp.Value]
				if !ok {
					ext := filepath.Ext(srcProp.Value)
					baseName := strings.TrimSuffix(srcProp.Value, ext)

					dstTextureList := &raw.WldFragBMInfo{ // aka BmInfo
						NameRef:      raw.NameAdd(baseName),
						TextureNames: []string{srcProp.Value},
					}
					wld.Fragments[fragIndex] = dstTextureList
					fragIndex++

					texture := &raw.WldFragSimpleSpriteDef{ // aka SimpleSpriteDef
						NameRef:        raw.NameAdd(srcProp.Value),
						Flags:          0x00000000,
						TextureCurrent: 0,
						Sleep:          0,
						TextureRefs:    []uint32{uint32(fragIndex - 1)},
					}

					wld.Fragments[fragIndex] = texture
					fragIndex++

					textureRefInst := &raw.WldFragSimpleSprite{ // aka SimpleSprite
						NameRef:    raw.NameAdd(srcProp.Value),
						TextureRef: int16(fragIndex - 1),
						Flags:      0x00000000,
					}

					wld.Fragments[fragIndex] = textureRefInst
					fragIndex++

					textureRefs[srcProp.Value] = fragIndex - 1
					textureRef = fragIndex - 1
				}

				dstMat.TextureRef = uint32(textureRef)
				dstMat.NameRef = raw.NameAdd(srcMat.Name)
				dstMat.Flags = 2
				dstMat.RenderMethod = 0x00000001
				dstMat.RGBPen = 0x00FFFFFF
				dstMat.Brightness = 0.0
				dstMat.ScaledAmbient = 0.75

				wld.Fragments[fragIndex] = dstMat
				fragIndex++
				materialList.MaterialRefs = append(materialList.MaterialRefs, uint32(fragIndex-1))
			}

			materialList.NameRef = raw.NameAdd(srcMat.Name)
			materialList.Flags = 0x00014003
			if model.FileType == "ter" {
				materialList.Flags = 0x00018003
			}
			wld.Fragments[fragIndex] = materialList
			fragIndex++
			mesh.MaterialListRef = uint32(fragIndex - 1)
		}
		mesh.NameRef = raw.NameAdd(model.Header.Name)
		mesh.Flags = 0x00014003

		mesh.AnimationRef = 0 // for anims later
		mesh.Fragment3Ref = 0
		mesh.Fragment4Ref = 0
		//mesh.Center
		//mesh.Params2

		//mesh.MaxDistance
		//mesh.Min
		//mesh.Max
		mesh.RawScale = 13
		scale := float32(1 / float32(int(1)<<int(mesh.RawScale)))

		for _, srcVert := range model.Vertices {
			mesh.Vertices = append(mesh.Vertices, [3]int16{int16(srcVert.Position.X / scale), int16(srcVert.Position.Y / scale), int16(srcVert.Position.Z / scale)})
			mesh.Normals = append(mesh.Normals, [3]int8{int8(srcVert.Normal.X), int8(srcVert.Normal.Y), int8(srcVert.Normal.Z)})
			mesh.Colors = append(mesh.Colors, raw.RGBA{R: srcVert.Tint.R, G: srcVert.Tint.G, B: srcVert.Tint.B, A: srcVert.Tint.A})
			mesh.UVs = append(mesh.UVs, [2]int16{int16(srcVert.Uv.X * 256), int16(srcVert.Uv.Y * 256)})
		}

		for _, srcTriangle := range model.Triangles {
			entry := raw.WldFragMeshTriangleEntry{
				Flags: uint16(srcTriangle.Flag),
				Index: [3]uint16{uint16(srcTriangle.Index.X), uint16(srcTriangle.Index.Y), uint16(srcTriangle.Index.Z)},
			}

			mesh.Triangles = append(mesh.Triangles, entry)
		}

		wld.Fragments[fragIndex] = mesh
		fragIndex++

		// materialist materialpalette is used to group materials for dmspritedef2 (aka mesh)
		// dmspriteref  instance of def2 is dmsprite
		// model lastly an actordef
	}

	return nil
}
