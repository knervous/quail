// virtual is Virtual World file format, it is used to make binary world more human readable and editable
package wld

import (
	"fmt"
	"io"
	"strconv"
	"strings"
	"sync"
)

var AsciiVersion = "v0.0.1"

// Wld is a struct representing a Wld file
type Wld struct {
	FileName               string
	GlobalAmbientLight     string
	Version                uint32
	SimpleSpriteDefs       []*SimpleSpriteDef
	MaterialDefs           []*MaterialDef
	MaterialPalettes       []*MaterialPalette
	DMSpriteDef2s          []*DMSpriteDef2
	ActorDefs              []*ActorDef
	ActorInsts             []*ActorInst
	LightDefs              []*LightDef
	PointLights            []*PointLight
	Sprite3DDefs           []*Sprite3DDef
	TrackInstances         []*TrackInstance
	TrackDefs              []*TrackDef
	HierarchicalSpriteDefs []*HierarchicalSpriteDef
	PolyhedronDefs         []*PolyhedronDefinition

	//writing temporary files
	mu                  sync.RWMutex
	writtenPalettes     map[string]bool
	writtenMaterials    map[string]bool
	writtenSpriteDefs   map[string]bool
	writtenActorDefs    map[string]bool
	writtenActorInsts   map[string]bool
	writtenLightDefs    map[string]bool
	writtenPointLights  map[string]bool
	writtenSprite3DDefs map[string]bool
}

// DMSpriteDef2 is a declaration of DMSpriteDef2
type DMSpriteDef2 struct {
	Tag          string     // TAG "%s"
	Flags        uint32     // FLAGS %d
	DmTrackTag   string     // DMTRACK "%s"
	Fragment3Ref int32      // ?? FRAGMENT3REF %d
	Fragment4Ref int32      // ?? FRAGMENT4REF %d
	Params2      [3]uint32  // ?? PARAMS2 %d %d %d
	MaxDistance  float32    // ?? MAXDISTANCE %0.7f
	Min          [3]float32 // ?? MIN %0.7f %0.7f %0.7f
	Max          [3]float32 // ?? MAX %0.7f %0.7f %0.7f

	CenterOffset [3]float32 // CENTEROFFSET %0.7f %0.7f %0.7f
	// NUMVERTICES %d
	Vertices [][3]float32 // XYZ %0.7f %0.7f %0.7f
	// NUMUVS %d
	UVs [][2]float32 // UV %0.7f %0.7f
	// NUMVERTEXNORMALS %d
	VertexNormals        [][3]float32 // XYZ %0.7f %0.7f %0.7f
	SkinAssignmentGroups [][2]uint16  // SKINASSIGNMENTGROUPS %d %d
	MaterialPaletteTag   string       // MATERIALPALETTE "%s"
	// NUMCOLORS %d
	Colors [][4]uint8 // RGBA %d %d %d %d
	// NUMFACE2S %d
	Faces []*Face // DMFACE
	// NUMMESHOPS %d
	MeshOps              []*MeshOp   // MESHOP
	FaceMaterialGroups   [][2]uint16 // FACEMATERIALGROUPS %d %d
	VertexMaterialGroups [][2]int16  // VERTEXMATERIALGROUPS %d %d
	BoundingRadius       float32     // BOUNDINGRADIUS %0.7f
	FPScale              uint16      // FPScale %d
	PolyhedronTag        string      // POLYHEDRON "%s"
}

func (wld *Wld) reset() {
	wld.writtenMaterials = make(map[string]bool)
	wld.writtenSpriteDefs = make(map[string]bool)
	wld.writtenPalettes = make(map[string]bool)
	wld.writtenActorDefs = make(map[string]bool)
	wld.writtenActorInsts = make(map[string]bool)
	wld.writtenLightDefs = make(map[string]bool)
	wld.writtenPointLights = make(map[string]bool)
	wld.writtenSprite3DDefs = make(map[string]bool)
}

func (d *DMSpriteDef2) Definition() string {
	return "DMSPRITEDEF2"
}

func (d *DMSpriteDef2) Write(w io.Writer) error {
	fmt.Fprintf(w, "DMSPRITEDEF2\n")
	fmt.Fprintf(w, "\tTAG \"%s\"\n", d.Tag)
	if d.Flags != 0 {
		fmt.Fprintf(w, "\tFLAGS %d\n", d.Flags)
	}
	fmt.Fprintf(w, "\tCENTEROFFSET %0.7f %0.7f %0.7f\n", d.CenterOffset[0], d.CenterOffset[1], d.CenterOffset[2])
	fmt.Fprintf(w, "\n")
	if len(d.Vertices) > 0 {
		fmt.Fprintf(w, "\tNUMVERTICES %d\n", len(d.Vertices))
		for _, vert := range d.Vertices {
			fmt.Fprintf(w, "\tXYZ %0.7f %0.7f %0.7f\n", vert[0], vert[1], vert[2])
		}
		fmt.Fprintf(w, "\n")
	}
	if len(d.UVs) > 0 {
		fmt.Fprintf(w, "\tNUMUVS %d\n", len(d.UVs))
		for _, uv := range d.UVs {
			fmt.Fprintf(w, "\tUV %0.7f, %0.7f\n", uv[0], uv[1])
		}
		fmt.Fprintf(w, "\n")
	}
	if len(d.VertexNormals) > 0 {
		fmt.Fprintf(w, "\tNUMVERTEXNORMALS %d\n", len(d.VertexNormals))
		for _, vn := range d.VertexNormals {
			fmt.Fprintf(w, "\tXYZ %0.7f %0.7f %0.7f\n", vn[0], vn[1], vn[2])
		}
		fmt.Fprintf(w, "\n")
	}
	if len(d.SkinAssignmentGroups) > 0 {
		fmt.Fprintf(w, "\n")
		fmt.Fprintf(w, "\tSKINASSIGNMENTGROUPS %d", len(d.SkinAssignmentGroups))
		for i, sa := range d.SkinAssignmentGroups {
			endComma := ","
			if i == len(d.SkinAssignmentGroups)-1 {
				endComma = ""
			}
			fmt.Fprintf(w, " %d, %d%s", sa[0], sa[1], endComma)
		}
		fmt.Fprintf(w, "\n")
	}
	fmt.Fprintf(w, "\tMATERIALPALETTE \"%s\"\n", d.MaterialPaletteTag)
	fmt.Fprintf(w, "\n")
	if d.PolyhedronTag != "" {
		fmt.Fprintf(w, "\tPOLYHEDRON\n")
		fmt.Fprintf(w, "\t\tDEFINITION \"%s\"\n", d.PolyhedronTag)
		fmt.Fprintf(w, "\tENDPOLYHEDRON\n\n")
	}
	if len(d.Faces) > 0 {
		fmt.Fprintf(w, "\tNUMFACE2S %d\n", len(d.Faces))
		fmt.Fprintf(w, "\n")
		for i, face := range d.Faces {
			fmt.Fprintf(w, "\tDMFACE2 //%d\n", i+1)
			if face.Flags != 0 {
				fmt.Fprintf(w, "\t\tFLAGS %d\n", face.Flags)
			}
			fmt.Fprintf(w, "\t\tTRIANGLE   %d, %d, %d\n", face.Triangle[0], face.Triangle[1], face.Triangle[2])
			fmt.Fprintf(w, "\tENDDMFACE2 //%d\n\n", i+1)
		}
		fmt.Fprintf(w, "\n")
	}
	if len(d.MeshOps) > 0 {
		//fmt.Fprintf(w, "\tNUMMESHOPS 0\n")
		fmt.Fprintf(w, "\t//TODO: NUMMESHOPS %d\n", len(d.MeshOps))
		for _, meshOp := range d.MeshOps {
			fmt.Fprintf(w, "\t// TODO: MESHOP %d %d %0.7f %d %d\n", meshOp.Index1, meshOp.Index2, meshOp.Offset, meshOp.Param1, meshOp.TypeField)
			// MESHOP_VA %d
		}
		fmt.Fprintf(w, "\n")
	}
	if len(d.FaceMaterialGroups) > 0 {
		fmt.Fprintf(w, "\tFACEMATERIALGROUPS %d", len(d.FaceMaterialGroups))
		for _, group := range d.FaceMaterialGroups {
			endComma := ","
			if group == d.FaceMaterialGroups[len(d.FaceMaterialGroups)-1] {
				endComma = ""
			}
			fmt.Fprintf(w, " %d, %d%s", group[0], group[1], endComma)
		}
		fmt.Fprintf(w, "\n")
	}
	if len(d.VertexMaterialGroups) > 0 {
		fmt.Fprintf(w, "\tVERTEXMATERIALGROUPS %d", len(d.VertexMaterialGroups))
		for _, group := range d.VertexMaterialGroups {
			endComma := ","
			if group == d.VertexMaterialGroups[len(d.VertexMaterialGroups)-1] {
				endComma = ""
			}
			fmt.Fprintf(w, " %d, %d%s", group[0], group[1], endComma)
		}
		fmt.Fprintf(w, "\n")
	}

	fmt.Fprintf(w, "\tBOUNDINGRADIUS %0.7f\n", d.BoundingRadius)
	fmt.Fprintf(w, "\n")
	fmt.Fprintf(w, "\tFPSCALE %d\n", d.FPScale)
	fmt.Fprintf(w, "ENDDMSPRITEDEF2\n\n")
	return nil
}

func (d *DMSpriteDef2) Read(r *AsciiReadToken) error {
	definition := "DMSPRITEDEF2"
	for {
		line, err := r.ReadProperty(definition)
		if err != nil {
			if err == io.EOF {
				break
			}
			return err
		}
		if line == "ENDDMSPRITEDEF2" {
			return nil
		}
		if line == "" {
			continue
		}
		switch {
		case strings.HasPrefix(line, "TAG"):
			line = strings.ReplaceAll(line, "\"", "")
			_, err = fmt.Sscanf(line, "TAG %s", &d.Tag)
			if err != nil {
				return fmt.Errorf("tag: %w", err)
			}
		case strings.HasPrefix(line, "FLAGS"):
			_, err = fmt.Sscanf(line, "FLAGS %d", &d.Flags)
			if err != nil {
				return fmt.Errorf("flags: %w", err)
			}
		case strings.HasPrefix(line, "CENTEROFFSET"):
			_, err = fmt.Sscanf(line, "CENTEROFFSET %f %f %f", &d.CenterOffset[0], &d.CenterOffset[1], &d.CenterOffset[2])
			if err != nil {
				return fmt.Errorf("center offset: %w", err)
			}
		case strings.HasPrefix(line, "NUMVERTICES"):
			var numVertices int
			_, err = fmt.Sscanf(line, "NUMVERTICES %d", &numVertices)
			if err != nil {
				return fmt.Errorf("num vertices: %w", err)
			}
			d.Vertices = make([][3]float32, numVertices)
			for i := 0; i < numVertices; i++ {
				line, err = r.ReadProperty(definition)
				if err != nil {
					return err
				}
				if !strings.HasPrefix(line, "XYZ") {
					return fmt.Errorf("expected XYZ, got %s", line)
				}
				_, err = fmt.Sscanf(line, "XYZ %f %f %f", &d.Vertices[i][0], &d.Vertices[i][1], &d.Vertices[i][2])
				if err != nil {
					return fmt.Errorf("vertex %d: %w", i, err)
				}
			}
		case strings.HasPrefix(line, "NUMUVS"):
			var numUVs int
			_, err = fmt.Sscanf(line, "NUMUVS %d", &numUVs)
			if err != nil {
				return fmt.Errorf("num uvs: %w", err)
			}
			d.UVs = make([][2]float32, numUVs)

			for i := 0; i < numUVs; i++ {
				line, err = r.ReadProperty(definition)
				if err != nil {
					return err
				}
				if !strings.HasPrefix(line, "UV") {
					return fmt.Errorf("expected UV, got %s", line)
				}
				line = strings.TrimPrefix(line, "UV")
				line = strings.TrimSpace(line)
				uvs := strings.Split(line, ", ")
				if len(uvs) != 2 {
					return fmt.Errorf("expected 2 uvs, got %d", len(uvs))
				}
				u, err := strconv.ParseFloat(uvs[0], 32)
				if err != nil {
					return fmt.Errorf("uv %d u: %w", i, err)
				}
				v, err := strconv.ParseFloat(uvs[1], 32)
				if err != nil {
					return fmt.Errorf("uv %d v: %w", i, err)
				}
				d.UVs[i] = [2]float32{float32(u), float32(v)}
			}
		case strings.HasPrefix(line, "NUMVERTEXNORMALS"):
			var numNormals int
			_, err = fmt.Sscanf(line, "NUMVERTEXNORMALS %d", &numNormals)
			if err != nil {
				return fmt.Errorf("num normals: %w", err)
			}
			d.VertexNormals = make([][3]float32, numNormals)
			for i := 0; i < numNormals; i++ {
				line, err = r.ReadProperty(definition)
				if err != nil {
					return err
				}
				if !strings.HasPrefix(line, "XYZ") {
					return fmt.Errorf("expected XYZ, got %s", line)
				}

				_, err = fmt.Sscanf(line, "XYZ %f %f %f", &d.VertexNormals[i][0], &d.VertexNormals[i][1], &d.VertexNormals[i][2])
				if err != nil {
					return fmt.Errorf("normal %d: %w", i, err)
				}
			}
		case strings.HasPrefix(line, "SKINASSIGNMENTGROUPS"):
			line = strings.TrimPrefix(line, "SKINASSIGNMENTGROUPS")
			line = strings.TrimSpace(line)
			index := strings.Index(line, " ")
			if index == -1 {
				return fmt.Errorf("expected space in skin assignment groups")
			}
			numGroups, err := strconv.Atoi(line[:index])
			if err != nil {
				return fmt.Errorf("num groups: %w", err)
			}
			d.SkinAssignmentGroups = make([][2]uint16, numGroups)
			line = line[index+1:]
			line = strings.ReplaceAll(line, ",", "")
			for i := 0; i < numGroups; i++ {
				index = strings.Index(line, " ")
				if index == -1 {
					return fmt.Errorf("expected space for val0 in skin assignment group %d", i)
				}
				val0, err := strconv.ParseUint(line[:index], 10, 16)
				if err != nil {
					return fmt.Errorf("group %d val0: %w", i, err)
				}
				line = line[index+1:]
				index = strings.Index(line, " ")
				if i == numGroups-1 {
					index = len(line)
				}
				if index == -1 {
					return fmt.Errorf("expected space for val1 in skin assignment group %d", i)
				}
				val1, err := strconv.ParseUint(line[:index], 10, 16)
				if err != nil {
					return fmt.Errorf("group %d val1: %w", i, err)
				}
				if i < numGroups-1 {
					line = line[index+1:]
				}
				d.SkinAssignmentGroups[i] = [2]uint16{uint16(val0), uint16(val1)}
			}
			if len(d.SkinAssignmentGroups) != numGroups {
				return fmt.Errorf("expected %d skin assignment groups, got %d", numGroups, len(d.SkinAssignmentGroups))
			}

		case strings.HasPrefix(line, "MATERIALPALETTE"):
			line = strings.ReplaceAll(line, "\"", "")
			_, err = fmt.Sscanf(line, "MATERIALPALETTE %s", &d.MaterialPaletteTag)
			if err != nil {
				return fmt.Errorf("material palette tag: %w", err)
			}
		case strings.HasPrefix(line, "NUMCOLORS"):
			var numColors int
			_, err = fmt.Sscanf(line, "NUMCOLORS %d", &numColors)
			if err != nil {
				return fmt.Errorf("num colors: %w", err)
			}
			d.Colors = make([][4]uint8, numColors)
			for i := 0; i < numColors; i++ {
				line, err = r.ReadProperty(definition)
				if err != nil {
					return err
				}
				if !strings.HasPrefix(line, "RGBA") {
					return fmt.Errorf("expected RGBA, got %s", line)
				}
				_, err = fmt.Sscanf(line, "RGBA %d %d %d %d", &d.Colors[i][0], &d.Colors[i][1], &d.Colors[i][2], &d.Colors[i][3])
				if err != nil {
					return fmt.Errorf("color %d: %w", i, err)
				}
			}
		case strings.HasPrefix(line, "NUMFACE2S"):
			var numFaces int

			_, err = fmt.Sscanf(line, "NUMFACE2S %d", &numFaces)
			if err != nil {
				return fmt.Errorf("num faces: %w", err)
			}
			d.Faces = make([]*Face, numFaces)
			for i := 0; i < numFaces; i++ {
				face := &Face{}
				line, err = r.ReadProperty(definition)
				if err != nil {
					return err
				}
				if !strings.HasPrefix(line, "DMFACE2") {
					return fmt.Errorf("expected DMFACE2, got %s", line)
				}
				for {
					line, err = r.ReadProperty(definition)
					if err != nil {
						return err
					}
					if strings.HasPrefix(line, "ENDDMFACE2") {
						break
					}
					if strings.HasPrefix(line, "FLAGS") {
						_, err = fmt.Sscanf(line, "FLAGS %d", &face.Flags)
						if err != nil {
							return fmt.Errorf("face %d flags: %w", i, err)
						}
					} else if strings.HasPrefix(line, "TRIANGLE") {
						_, err = fmt.Sscanf(line, "TRIANGLE   %d, %d, %d", &face.Triangle[0], &face.Triangle[1], &face.Triangle[2])
						if err != nil {
							return fmt.Errorf("face %d triangle: %w", i, err)
						}
					}
				}
				d.Faces[i] = face
			}
		case strings.HasPrefix(line, "NUMMESHOPS"):
			var numMeshOps int
			_, err = fmt.Sscanf(line, "NUMMESHOPS %d", &numMeshOps)
			if err != nil {
				return fmt.Errorf("num mesh ops: %w", err)
			}
			d.MeshOps = make([]*MeshOp, numMeshOps)
			for i := 0; i < numMeshOps; i++ {
				meshOp := &MeshOp{}
				line, err = r.ReadProperty(definition)
				if err != nil {
					return err
				}
				if !strings.HasPrefix(line, "MESHOP") {
					return fmt.Errorf("expected MESHOP, got %s", line)
				}

				line = strings.TrimPrefix(line, "MESHOP")
				line = strings.TrimSpace(line)
				index := strings.Index(line, " ")
				if index == -1 {
					return fmt.Errorf("expected space in mesh op %d", i)
				}
				//context := line[1:index]
				//fmt.Println("context:", context)

				d.MeshOps[i] = meshOp
			}
		case strings.HasPrefix(line, "FACEMATERIALGROUPS"):
			line = strings.TrimPrefix(line, "FACEMATERIALGROUPS")
			line = strings.TrimSpace(line)
			index := strings.Index(line, " ")
			if index == -1 {
				return fmt.Errorf("expected space in face material groups")
			}
			numGroups, err := strconv.Atoi(line[:index])
			if err != nil {
				return fmt.Errorf("num groups: %w", err)
			}
			d.FaceMaterialGroups = make([][2]uint16, numGroups)
			line = line[index+1:]
			line = strings.ReplaceAll(line, ",", "")
			for i := 0; i < numGroups; i++ {
				index = strings.Index(line, " ")
				if index == -1 {
					return fmt.Errorf("expected space for val0 in face material group %d", i)
				}
				val0, err := strconv.ParseUint(line[:index], 10, 16)
				if err != nil {
					return fmt.Errorf("group %d val0: %w", i, err)
				}
				line = line[index+1:]
				index = strings.Index(line, " ")
				if i == numGroups-1 {
					index = len(line)
				}
				if index == -1 {
					return fmt.Errorf("expected space for val1 in face material group %d", i)
				}
				val1, err := strconv.ParseUint(line[:index], 10, 16)
				if err != nil {
					return fmt.Errorf("group %d val1: %w", i, err)
				}
				if i < numGroups-1 {
					line = line[index+1:]
				}
				d.FaceMaterialGroups[i] = [2]uint16{uint16(val0), uint16(val1)}
			}

		case strings.HasPrefix(line, "VERTEXMATERIALGROUPS"):
			line = strings.TrimPrefix(line, "VERTEXMATERIALGROUPS")
			line = strings.TrimSpace(line)
			index := strings.Index(line, " ")
			if index == -1 {
				return fmt.Errorf("expected space in vertex material groups")
			}
			numGroups, err := strconv.Atoi(line[:index])
			if err != nil {
				return fmt.Errorf("num groups: %w", err)
			}
			d.VertexMaterialGroups = make([][2]int16, numGroups)
			line = line[index+1:]
			line = strings.ReplaceAll(line, ",", "")
			for i := 0; i < numGroups; i++ {
				index = strings.Index(line, " ")
				if index == -1 {
					return fmt.Errorf("expected space for val0 in vertex material group %d", i)
				}
				val0, err := strconv.ParseInt(line[:index], 10, 16)
				if err != nil {
					return fmt.Errorf("group %d val0: %w", i, err)
				}
				line = line[index+1:]
				index = strings.Index(line, " ")
				if i == numGroups-1 {
					index = len(line)
				}
				if index == -1 {
					return fmt.Errorf("expected space for val1 in vertex material group %d", i)
				}
				val1Str := line[:index]

				val1, err := strconv.ParseInt(val1Str, 10, 16)
				if err != nil {
					return fmt.Errorf("group %d val1: %w", i, err)
				}
				if i < numGroups-1 {
					line = line[index+1:]
				}
				d.VertexMaterialGroups[i] = [2]int16{int16(val0), int16(val1)}
			}

		case strings.HasPrefix(line, "BOUNDINGRADIUS"):
			_, err = fmt.Sscanf(line, "BOUNDINGRADIUS %f", &d.BoundingRadius)
			if err != nil {
				return fmt.Errorf("bounding radius: %w", err)
			}
		case strings.HasPrefix(line, "FPSCALE"):
			_, err = fmt.Sscanf(line, "FPSCALE %d", &d.FPScale)
			if err != nil {
				return fmt.Errorf("fpscale: %w", err)
			}
		case strings.HasPrefix(line, "POLYHEDRON"):
			line, err = r.ReadProperty(definition)
			if err != nil {
				return err
			}
			if !strings.HasPrefix(line, "DEFINITION") {
				return fmt.Errorf("expected POLYHEDRON DEFINITION, got %s", line)
			}
			line = strings.TrimPrefix(line, "DEFINITION")
			line = strings.ReplaceAll(line, "\"", "")
			line = strings.TrimSpace(line)
			d.PolyhedronTag = line
			line, err = r.ReadProperty(definition)
			if err != nil {
				return err
			}
			if !strings.HasPrefix(line, "ENDPOLYHEDRON") {
				return fmt.Errorf("expected ENDPOLYHEDRON, got %s", line)
			}

		default:
			return fmt.Errorf("unknown property: %s", line)
		}
	}
	return nil
}

type Face struct {
	Flags    uint16    // FLAGS %d
	Triangle [3]uint16 // TRIANGLE %d %d %d
}

type MeshOp struct {
	Index1    uint16
	Index2    uint16
	Offset    float32
	Param1    uint8
	TypeField uint8
}

// MaterialPalette is a declaration of MATERIALPALETTE
type MaterialPalette struct {
	Tag          string // TAG "%s"
	numMaterials int    // NUMMATERIALS %d
	flags        uint32
	Materials    []string // MATERIAL "%s"
}

func (m *MaterialPalette) Definition() string {
	return "MATERIALPALETTE"
}

func (m *MaterialPalette) Write(w io.Writer) error {
	fmt.Fprintf(w, "%s\n", m.Definition())
	fmt.Fprintf(w, "\tTAG \"%s\"\n", m.Tag)
	fmt.Fprintf(w, "\tNUMMATERIALS %d\n", len(m.Materials))
	for _, mat := range m.Materials {
		fmt.Fprintf(w, "\tMATERIAL \"%s\"\n", mat)
	}
	fmt.Fprintf(w, "ENDMATERIALPALETTE\n\n")
	return nil
}

func (m *MaterialPalette) Read(r *AsciiReadToken) error {
	for {
		line, err := r.ReadProperty(m.Definition())
		if err != nil {
			if err == io.EOF {
				break
			}
			return err
		}
		if line == "ENDMATERIALPALETTE" {
			break
		}
		if line == "" {
			continue
		}
		switch {
		case strings.HasPrefix(line, "TAG"):
			line = strings.ReplaceAll(line, "\"", "")
			_, err = fmt.Sscanf(line, "TAG %s", &m.Tag)
			if err != nil {
				return fmt.Errorf("%s: %w", line, err)
			}
		case strings.HasPrefix(line, "NUMMATERIALS"):
			_, err = fmt.Sscanf(line, "NUMMATERIALS %d", &m.numMaterials)
			if err != nil {
				return fmt.Errorf("%s: %w", line, err)
			}
		case strings.HasPrefix(line, "MATERIAL"):
			line = strings.ReplaceAll(line, "\"", "")
			var mat string
			_, err = fmt.Sscanf(line, "MATERIAL %s", &mat)
			if err != nil {
				return fmt.Errorf("%s: %w", line, err)
			}
			m.Materials = append(m.Materials, mat)

		default:
			return fmt.Errorf("unknown property: %s", line)
		}
	}

	if m.Tag == "" {
		return fmt.Errorf("missing tag")
	}

	if m.numMaterials != len(m.Materials) {
		return fmt.Errorf("expected %d materials, got %d", m.numMaterials, len(m.Materials))
	}
	return nil
}

// MaterialDef is an entry MATERIALDEFINITION
type MaterialDef struct {
	Tag                  string   // TAG %s
	Flags                uint32   // FLAGS %d
	RenderMethod         string   // RENDERMETHOD %s
	RGBPen               [4]uint8 // RGBPEN %d %d %d
	Brightness           float32  // BRIGHTNESS %0.7f
	ScaledAmbient        float32  // SCALEDAMBIENT %0.7f
	SimpleSpriteInstTag  string   // SIMPLESPRITEINST
	SimpleSpriteInstFlag uint32   // FLAGS %d
}

func (m *MaterialDef) Definition() string {
	return "MATERIALDEFINITION"
}

func (m *MaterialDef) Write(w io.Writer) error {
	fmt.Fprintf(w, "%s\n", m.Definition())
	fmt.Fprintf(w, "\tTAG \"%s\"\n", m.Tag)
	fmt.Fprintf(w, "\tFLAGS %d\n", m.Flags)
	fmt.Fprintf(w, "\tRENDERMETHOD %s\n", m.RenderMethod)
	fmt.Fprintf(w, "\tRGBPEN %d %d %d\n", m.RGBPen[0], m.RGBPen[1], m.RGBPen[2])
	fmt.Fprintf(w, "\tBRIGHTNESS %0.7f\n", m.Brightness)
	fmt.Fprintf(w, "\tSCALEDAMBIENT %0.7f\n", m.ScaledAmbient)
	if m.SimpleSpriteInstTag != "" {
		fmt.Fprintf(w, "\tSIMPLESPRITEINST\n")
		fmt.Fprintf(w, "\t\tTAG \"%s\"\n", m.SimpleSpriteInstTag)
		if m.SimpleSpriteInstFlag != 0 {
			fmt.Fprintf(w, "\t\tFLAGS %d\n", m.SimpleSpriteInstFlag)
		}
		fmt.Fprintf(w, "\tENDSIMPLESPRITEINST\n")
	}
	fmt.Fprintf(w, "ENDMATERIALDEFINITION\n\n")
	return nil
}

func (m *MaterialDef) Read(r *AsciiReadToken) error {
	for {
		line, err := r.ReadProperty(m.Definition())
		if err != nil {
			if err == io.EOF {
				break
			}
			return err
		}
		if line == "ENDMATERIALDEFINITION" {
			break
		}
		if line == "" {
			continue
		}
		switch {
		case strings.HasPrefix(line, "TAG"):
			line = strings.ReplaceAll(line, "\"", "")
			_, err = fmt.Sscanf(line, "TAG %s", &m.Tag)
			if err != nil {
				return fmt.Errorf("tag: %w", err)
			}
			m.Tag = strings.TrimSpace(m.Tag)
		case strings.HasPrefix(line, "FLAGS"):
			_, err = fmt.Sscanf(line, "FLAGS %d", &m.Flags)
			if err != nil {
				return fmt.Errorf("flags: %w", err)
			}
			m.Flags = uint32(m.Flags)
		case strings.HasPrefix(line, "RENDERMETHOD"):
			line = strings.ReplaceAll(line, "\"", "")
			_, err = fmt.Sscanf(line, "RENDERMETHOD %s", &m.RenderMethod)
			if err != nil {
				return fmt.Errorf("render method: %w", err)
			}
			m.RenderMethod = strings.TrimSpace(m.RenderMethod)
		case strings.HasPrefix(line, "RGBPEN"):

			_, err = fmt.Sscanf(line, "RGBPEN %d %d %d", &m.RGBPen[0], &m.RGBPen[1], &m.RGBPen[2])
			if err != nil {
				return fmt.Errorf("rgbpen: %w", err)
			}
			m.RGBPen = [4]uint8{m.RGBPen[0], m.RGBPen[1], m.RGBPen[2], 0}
		case strings.HasPrefix(line, "BRIGHTNESS"):
			line = strings.TrimPrefix(line, "BRIGHTNESS")
			line = strings.TrimSpace(line)
			brightness, err := strconv.ParseFloat(line, 32)
			if err != nil {
				return fmt.Errorf("brightness: %w", err)
			}
			m.Brightness = float32(brightness)
		case strings.HasPrefix(line, "SCALEDAMBIENT"):
			line = strings.TrimPrefix(line, "SCALEDAMBIENT")
			line = strings.TrimSpace(line)
			ambient, err := strconv.ParseFloat(line, 32)
			if err != nil {
				return fmt.Errorf("ambient: %w", err)
			}
			m.ScaledAmbient = float32(ambient)
		case strings.HasPrefix(line, "SIMPLESPRITEINST"):
			line, err = r.ReadProperty(m.Definition())
			if err != nil {
				return err
			}
			if !strings.HasPrefix(line, "TAG") {
				return fmt.Errorf("expected TAG, got %s", line)
			}
			line = strings.ReplaceAll(line, "\"", "")
			_, err = fmt.Sscanf(line, "TAG %s", &m.SimpleSpriteInstTag)
			if err != nil {
				return fmt.Errorf("simple sprite inst tag: %w", err)
			}
			line, err = r.ReadProperty(m.Definition())
			if err != nil {
				return err
			}
			if line != "ENDSIMPLESPRITEINST" {
				return fmt.Errorf("expected ENDSIMPLESPRITEINST, got %s", line)
			}

		default:
			return fmt.Errorf("unknown property: %s", line)
		}
	}
	return nil
}

// SimpleSpriteDef is a declaration of SIMPLESPRITEDEF
type SimpleSpriteDef struct {
	Tag string // SIMPLESPRITETAG "%s"
	// NUMFRAMES %d
	BMInfos [][2]string // BMINFO "%s" "%s"
}

func (s *SimpleSpriteDef) Definition() string {
	return "SIMPLESPRITEDEF"
}

func (s *SimpleSpriteDef) Write(w io.Writer) error {
	fmt.Fprintf(w, "%s\n", s.Definition())
	fmt.Fprintf(w, "\tSIMPLESPRITETAG \"%s\"\n", s.Tag)
	fmt.Fprintf(w, "\tNUMFRAMES %d\n", len(s.BMInfos))
	for _, bm := range s.BMInfos {
		fmt.Fprintf(w, "\tFRAME \"%s\" \"%s\"\n", bm[0], bm[1])
	}
	if len(s.BMInfos) > 0 {
		fmt.Fprintf(w, "\tBMINFO \"%s\" \"%s\"\n", s.BMInfos[0][0], s.BMInfos[0][1])
	}
	fmt.Fprintf(w, "ENDSIMPLESPRITEDEF\n\n")
	return nil
}

func (s *SimpleSpriteDef) Read(r *AsciiReadToken) error {
	for {
		line, err := r.ReadProperty(s.Definition())
		if err != nil {
			if err == io.EOF {
				break
			}
			return err
		}
		if line == "ENDSIMPLESPRITEDEF" {
			break
		}
		if line == "" {
			continue
		}
		switch {
		case strings.HasPrefix(line, "SIMPLESPRITETAG"):
			line = strings.ReplaceAll(line, "\"", "")
			_, err = fmt.Sscanf(line, "SIMPLESPRITETAG %s", &s.Tag)
			if err != nil {
				return fmt.Errorf("tag: %w", err)
			}
		case strings.HasPrefix(line, "NUMFRAMES"):
			var numFrames int
			_, err = fmt.Sscanf(line, "NUMFRAMES %d", &numFrames)
			if err != nil {
				return fmt.Errorf("num frames: %w", err)
			}
			s.BMInfos = make([][2]string, numFrames)
			for i := 0; i < numFrames; i++ {
				line, err = r.ReadProperty(s.Definition())
				if err != nil {
					return err
				}
				if !strings.HasPrefix(line, "BMINFO") {
					return fmt.Errorf("expected BMINFO, got %s", line)
				}
				line = strings.TrimPrefix(line, "BMINFO")
				line = strings.TrimSpace(line)
				line = strings.ReplaceAll(line, "\"", "")
				records := strings.Split(line, " ")
				if len(records) != 2 {
					return fmt.Errorf("expected 2 records, got %d", len(records))
				}
				s.BMInfos[i] = [2]string{records[0], records[1]}
			}

		default:
			return fmt.Errorf("unknown property: %s", line)
		}
	}
	return nil
}

// ActorDef is a declaration of ACTORDEF
type ActorDef struct {
	Tag           string     // ACTORTAG "%s"
	Callback      string     // CALLBACK "%s"
	BoundsRef     int32      // ?? BOUNDSTAG "%s"
	CurrentAction uint32     // ?? CURRENTACTION %d
	Location      [6]float32 // LOCATION %0.7f %0.7f %0.7f %d %d %d
	Unk1          uint32     // ?? UNK1 %d
	// NUMACTIONS %d
	Actions []ActorAction // ACTION
	// NUMFRAGMENTS %d
	FragmentRefs []uint32 // FRAGMENTREF %d
}

func (a *ActorDef) Definition() string {
	return "ACTORDEF"
}

func (a *ActorDef) Write(w io.Writer) error {
	fmt.Fprintf(w, "%s\n", a.Definition())
	fmt.Fprintf(w, "\tACTORTAG \"%s\"\n", a.Tag)
	fmt.Fprintf(w, "\tCALLBACK \"%s\"\n", a.Callback)
	fmt.Fprintf(w, "\t//TODO: BOUNDSREF %d\n", a.BoundsRef)
	if a.CurrentAction != 0 {
		fmt.Fprintf(w, "\t//TODO: CURRENTACTION %d\n", a.CurrentAction)
	}
	fmt.Fprintf(w, "\tLOCATION %0.7f %0.7f %0.7f\n", a.Location[0], a.Location[1], a.Location[2])
	fmt.Fprintf(w, "\tNUMACTIONS %d\n", len(a.Actions))
	for _, action := range a.Actions {
		fmt.Fprintf(w, "\tACTION\n")
		for _, lod := range action.LevelOfDetails {
			fmt.Fprintf(w, "\t\t// TODO: UNK1 \"%d\"\n", lod.Unk1)
			fmt.Fprintf(w, "\t\tMINDISTANCE %0.7f\n", lod.MinDistance)
		}
		fmt.Fprintf(w, "\tENDACTION\n")
	}
	fmt.Fprintf(w, "\t// TODO: NUMFRAGMENTS %d\n", len(a.FragmentRefs))
	for _, frag := range a.FragmentRefs {
		fmt.Fprintf(w, "\t//TODO: FRAGMENTREF %d\n", frag)
	}
	fmt.Fprintf(w, "ENDACTORDEF\n\n")
	return nil
}

func (a *ActorDef) Read(r *AsciiReadToken) error {
	for {
		line, err := r.ReadProperty(a.Definition())
		if err != nil {
			if err == io.EOF {
				break
			}
			return err
		}
		if line == "ENDACTORDEF" {
			break
		}
		if line == "" {
			continue
		}
		switch {
		case strings.HasPrefix(line, "ACTORTAG"):
			line = strings.ReplaceAll(line, "\"", "")
			_, err = fmt.Sscanf(line, "ACTORTAG %s", &a.Tag)
			if err != nil {
				return fmt.Errorf("tag: %w", err)
			}
		case strings.HasPrefix(line, "CALLBACK"):
			line = strings.ReplaceAll(line, "\"", "")
			_, err = fmt.Sscanf(line, "CALLBACK %s", &a.Callback)
			if err != nil {
				return fmt.Errorf("callback: %w", err)
			}
		case strings.HasPrefix(line, "LOCATION"):
			_, err = fmt.Sscanf(line, "LOCATION %f %f %f", &a.Location[0], &a.Location[1], &a.Location[2])
			if err != nil {
				return fmt.Errorf("location: %w", err)
			}
		case strings.HasPrefix(line, "NUMACTIONS"):
			var numActions int
			_, err = fmt.Sscanf(line, "NUMACTIONS %d", &numActions)
			if err != nil {
				return fmt.Errorf("num actions: %w", err)
			}
			a.Actions = make([]ActorAction, numActions)
			for i := 0; i < numActions; i++ {
				action := ActorAction{}
				line, err = r.ReadProperty(a.Definition())
				if err != nil {
					return err
				}
				if !strings.HasPrefix(line, "ACTION") {
					return fmt.Errorf("expected ACTION, got %s", line)
				}
				for {
					line, err = r.ReadProperty(a.Definition())
					if err != nil {
						return err
					}
					if strings.HasPrefix(line, "ENDACTION") {
						break
					}
					if strings.HasPrefix(line, "MINDISTANCE") {
						line = strings.TrimPrefix(line, "MINDISTANCE")
						line = strings.TrimSpace(line)
						distance, err := strconv.ParseFloat(line, 32)
						if err != nil {
							return fmt.Errorf("mindistance: %w", err)
						}
						action.LevelOfDetails = append(action.LevelOfDetails, ActorLevelOfDetail{MinDistance: float32(distance)})
					}
				}
				a.Actions[i] = action
			}
		case strings.HasPrefix(line, "NUMFRAGMENTS"):
			var numFragments int
			_, err = fmt.Sscanf(line, "NUMFRAGMENTS %d", &numFragments)
			if err != nil {
				return fmt.Errorf("num fragments: %w", err)
			}
			a.FragmentRefs = make([]uint32, numFragments)
			for i := 0; i < numFragments; i++ {
				line, err = r.ReadProperty(a.Definition())
				if err != nil {
					return err
				}
				if !strings.HasPrefix(line, "FRAGMENTREF") {
					return fmt.Errorf("expected FRAGMENTREF, got %s", line)
				}
				line = strings.TrimPrefix(line, "FRAGMENTREF")
				line = strings.TrimSpace(line)
				fragment, err := strconv.ParseUint(line, 10, 32)
				if err != nil {
					return fmt.Errorf("fragment ref: %w", err)
				}
				a.FragmentRefs[i] = uint32(fragment)
			}

		default:
			return fmt.Errorf("unknown property: %s", line)
		}
	}
	return nil
}

// ActorAction is a declaration of ACTION
type ActorAction struct {
	//NUMLEVELSOFDETAIL %d
	LevelOfDetails []ActorLevelOfDetail // LEVELOFDETAIL
}

// ActorLevelOfDetail is a declaration of LEVELOFDETAIL
type ActorLevelOfDetail struct {
	Unk1        uint32  // ?? HIERARCHICALSPRITE "%s"
	MinDistance float32 // MINDISTANCE %0.7f
}

// ActorInst is a declaration of ACTORINST
type ActorInst struct {
	Tag            string     // ?? ACTORTAG "%s"
	Flags          uint32     // ?? FLAGS %d
	SphereTag      string     // ?? SPHERETAG "%s"
	CurrentAction  uint32     // ?? CURRENTACTION %d
	DefinitionTag  string     // DEFINITION "%s"
	Location       [6]float32 // LOCATION %0.7f %0.7f %0.7f %d %d %d
	Unk1           uint32     // ?? UNK1 %d
	BoundingRadius float32    // BOUNDINGRADIUS %0.7f
	Scale          float32    // SCALEFACTOR %0.7f
	Unk2           int32      // ?? UNK2 %d
}

func (a *ActorInst) Definition() string {
	return "ACTORINST"
}

func (a *ActorInst) Write(w io.Writer) error {
	fmt.Fprintf(w, "%s\n", a.Definition())
	fmt.Fprintf(w, "\tACTORTAG \"%s\"\n", a.Tag)
	if a.Flags&0x20 != 0 {
		fmt.Fprintf(w, "\tACTIVE\n")
	}
	fmt.Fprintf(w, "\tSPHERETAG \"%s\"\n", a.SphereTag)
	if a.CurrentAction != 0 {
		fmt.Fprintf(w, "\tCURRENTACTION %d\n", a.CurrentAction)
	}
	fmt.Fprintf(w, "\tDEFINITION \"%s\"\n", a.DefinitionTag)
	fmt.Fprintf(w, "\tLOCATION %0.7f %0.7f %0.7f\n", a.Location[0], a.Location[1], a.Location[2])
	if a.Unk1 != 0 {
		fmt.Fprintf(w, "\tUNK1 %d\n", a.Unk1)
	}
	fmt.Fprintf(w, "\tBOUNDINGRADIUS %0.7f\n", a.BoundingRadius)
	fmt.Fprintf(w, "\tSCALEFACTOR %0.7f\n", a.Scale)
	if a.Unk2 != 0 {
		fmt.Fprintf(w, "\tUNK2 %d\n", a.Unk2)
	}
	fmt.Fprintf(w, "ENDACTORINST\n\n")
	return nil
}

func (a *ActorInst) Read(r *AsciiReadToken) error {
	for {
		line, err := r.ReadProperty(a.Definition())
		if err != nil {
			if err == io.EOF {
				break
			}
			return err
		}
		if line == "ENDACTORINST" {
			break
		}
		if line == "" {
			continue
		}
		switch {
		case strings.HasPrefix(line, "ACTORTAG"):

			line = strings.ReplaceAll(line, "\"", "")
			_, err = fmt.Sscanf(line, "ACTORTAG %s", &a.Tag)
			if err != nil {
				return fmt.Errorf("tag: %w", err)
			}
		case strings.HasPrefix(line, "ACTIVE"):
			a.Flags |= 0x20
		case strings.HasPrefix(line, "SPHERETAG"):
			line = strings.ReplaceAll(line, "\"", "")
			_, err = fmt.Sscanf(line, "SPHERETAG %s", &a.SphereTag)
			if err != nil {
				return fmt.Errorf("sphere tag: %w", err)
			}
		case strings.HasPrefix(line, "CURRENTACTION"):
			_, err = fmt.Sscanf(line, "CURRENTACTION %d", &a.CurrentAction)
			if err != nil {
				return fmt.Errorf("current action: %w", err)
			}
		case strings.HasPrefix(line, "DEFINITION"):
			line = strings.ReplaceAll(line, "\"", "")
			_, err = fmt.Sscanf(line, "DEFINITION %s", &a.DefinitionTag)
			if err != nil {
				return fmt.Errorf("definition tag: %w", err)
			}
		case strings.HasPrefix(line, "LOCATION"):

			_, err = fmt.Sscanf(line, "LOCATION %f %f %f", &a.Location[0], &a.Location[1], &a.Location[2])
			if err != nil {
				return fmt.Errorf("location: %w", err)
			}
		case strings.HasPrefix(line, "UNK1"):
			_, err = fmt.Sscanf(line, "UNK1 %d", &a.Unk1)
			if err != nil {
				return fmt.Errorf("unk1: %w", err)
			}
		case strings.HasPrefix(line, "BOUNDINGRADIUS"):
			_, err = fmt.Sscanf(line, "BOUNDINGRADIUS %f", &a.BoundingRadius)

			if err != nil {
				return fmt.Errorf("bounding radius: %w", err)
			}
		case strings.HasPrefix(line, "SCALEFACTOR"):
			_, err = fmt.Sscanf(line, "SCALEFACTOR %f", &a.Scale)
			if err != nil {
				return fmt.Errorf("scale factor: %w", err)
			}
		case strings.HasPrefix(line, "UNK2"):
			_, err = fmt.Sscanf(line, "UNK2 %d", &a.Unk2)
			if err != nil {
				return fmt.Errorf("unk2: %w", err)
			}

		default:
			return fmt.Errorf("unknown property: %s", line)
		}
	}
	return nil
}

// LightDef is a declaration of LIGHTDEF
type LightDef struct {
	Tag             string // TAG "%s"
	Flags           uint32 // ?? FLAGS %d
	FrameCurrentRef uint32 // ?? FRAMECURRENT "%d"
	Sleep           uint32 // SLEEP %d
	// NUMFRAMES %d
	LightLevels []float32 // LIGHTLEVELS %0.7f
	// NUMCOLORS %d
	Colors [][3]float32 // COLORS %0.7f %0.7f %0.7f
}

func (l *LightDef) Definition() string {
	return "LIGHTDEFINITION"
}

func (l *LightDef) Write(w io.Writer) error {
	fmt.Fprintf(w, "%s\n", l.Definition())
	fmt.Fprintf(w, "\tTAG \"%s\"\n", l.Tag)
	if l.Flags&0x01 != 0 {
		fmt.Fprintf(w, "\tCURRENT_FRAME \"%d\"\n", l.FrameCurrentRef)
	}
	fmt.Fprintf(w, "\tNUMFRAMES %d\n", len(l.LightLevels))
	if l.Flags&0x04 != 0 {
		for _, level := range l.LightLevels {
			fmt.Fprintf(w, "\tLIGHTLEVELS %0.6f\n", level)
		}
	}
	if l.Flags&0x02 != 0 {
		fmt.Fprintf(w, "\tSLEEP %d\n", l.Sleep)
	}
	if l.Flags&0x08 != 0 {
		fmt.Fprintf(w, "\tSKIPFRAMES ON\n")
	}
	if l.Flags&0x10 != 0 {
		fmt.Fprintf(w, "\tNUMCOLORS %d\n", len(l.Colors))
		for _, color := range l.Colors {
			fmt.Fprintf(w, "\tCOLOR %0.6f %0.6f %0.6f\n", color[0], color[1], color[2])
		}
	}
	fmt.Fprintf(w, "ENDLIGHTDEFINITION\n\n")
	return nil
}

func (l *LightDef) Read(r *AsciiReadToken) error {
	for {
		line, err := r.ReadProperty(l.Definition())
		if err != nil {
			if err == io.EOF {
				break
			}
			return err
		}
		if line == "ENDLIGHTDEFINITION" {
			break
		}
		if line == "" {
			continue
		}
		switch {
		case strings.HasPrefix(line, "TAG"):
			line = strings.ReplaceAll(line, "\"", "")
			_, err = fmt.Sscanf(line, "TAG %s", &l.Tag)
			if err != nil {
				return fmt.Errorf("tag: %w", err)
			}
		case strings.HasPrefix(line, "CURRENT_FRAME"):
			_, err = fmt.Sscanf(line, "CURRENT_FRAME %d", &l.FrameCurrentRef)
			if err != nil {
				return fmt.Errorf("current frame: %w", err)
			}
		case strings.HasPrefix(line, "NUMFRAMES"):
			var numFrames int
			_, err = fmt.Sscanf(line, "NUMFRAMES %d", &numFrames)
			if err != nil {
				return fmt.Errorf("num frames: %w", err)
			}
			l.LightLevels = make([]float32, numFrames)
			for i := 0; i < numFrames; i++ {
				line, err = r.ReadProperty(l.Definition())
				if err != nil {
					return err
				}
				if !strings.HasPrefix(line, "LIGHTLEVELS") {
					return fmt.Errorf("expected LIGHTLEVELS, got %s", line)
				}
				line = strings.TrimPrefix(line, "LIGHTLEVELS")
				line = strings.TrimSpace(line)
				level, err := strconv.ParseFloat(line, 32)
				if err != nil {
					return fmt.Errorf("light level: %w", err)
				}
				l.LightLevels[i] = float32(level)
			}
		case strings.HasPrefix(line, "SLEEP"):
			_, err = fmt.Sscanf(line, "SLEEP %d", &l.Sleep)
			if err != nil {
				return fmt.Errorf("sleep: %w", err)
			}
		case strings.HasPrefix(line, "SKIPFRAMES"):
			l.Flags |= 0x08
		case strings.HasPrefix(line, "NUMCOLORS"):
			var numColors int
			_, err = fmt.Sscanf(line, "NUMCOLORS %d", &numColors)
			if err != nil {
				return fmt.Errorf("num colors: %w", err)
			}
			l.Colors = make([][3]float32, numColors)
			for i := 0; i < numColors; i++ {
				line, err = r.ReadProperty(l.Definition())
				if err != nil {
					return err
				}
				if !strings.HasPrefix(line, "COLOR") {
					return fmt.Errorf("expected COLOR, got %s", line)
				}
				line = strings.TrimPrefix(line, "COLOR")
				line = strings.TrimSpace(line)
				records := strings.Split(line, " ")
				if len(records) != 3 {
					return fmt.Errorf("expected 3 records, got %d", len(records))
				}
				for j, record := range records {
					color, err := strconv.ParseFloat(record, 32)
					if err != nil {
						return fmt.Errorf("color: %w", err)
					}
					l.Colors[i][j] = float32(color)
				}
			}

		default:
			return fmt.Errorf("unknown property: %s", line)
		}
	}
	return nil
}

// PointLight is a declaration of POINTLIGHT
type PointLight struct {
	Tag         string     // TAG "%s"
	LightDefTag string     // LIGHT "%s"
	Flags       uint32     // FLAGS %d
	Location    [3]float32 // XYZ %0.7f %0.7f %0.7f
	Radius      float32    // RADIUSOFINFLUENCE %0.7f
}

func (p *PointLight) Definition() string {
	return "POINTLIGHT"
}

func (p *PointLight) Write(w io.Writer) error {
	fmt.Fprintf(w, "%s\n", p.Definition())
	fmt.Fprintf(w, "\tTAG \"%s\"\n", p.Tag)
	fmt.Fprintf(w, "\tXYZ %0.6f %0.6f %0.6f\n", p.Location[0], p.Location[1], p.Location[2])
	fmt.Fprintf(w, "\tLIGHT \"%s\"\n", p.LightDefTag)
	if p.Flags != 0 {
		fmt.Fprintf(w, "\tFLAGS %d\n", p.Flags)
	}
	fmt.Fprintf(w, "\tRADIUSOFINFLUENCE %0.7f\n", p.Radius)
	fmt.Fprintf(w, "ENDPOINTLIGHT\n\n")
	return nil
}

func (p *PointLight) Read(r *AsciiReadToken) error {
	for {
		line, err := r.ReadProperty(p.Definition())
		if err != nil {
			if err == io.EOF {
				break
			}
			return err
		}
		if line == "ENDPOINTLIGHT" {
			break
		}
		if line == "" {
			continue
		}
		switch {
		case strings.HasPrefix(line, "TAG"):
			line = strings.ReplaceAll(line, "\"", "")
			_, err = fmt.Sscanf(line, "TAG %s", &p.Tag)
			if err != nil {
				return fmt.Errorf("tag: %w", err)
			}
		case strings.HasPrefix(line, "XYZ"):

			_, err = fmt.Sscanf(line, "XYZ %f %f %f", &p.Location[0], &p.Location[1], &p.Location[2])
			if err != nil {
				return fmt.Errorf("location: %w", err)
			}
		case strings.HasPrefix(line, "LIGHT"):
			line = strings.ReplaceAll(line, "\"", "")
			_, err = fmt.Sscanf(line, "LIGHT %s", &p.LightDefTag)
			if err != nil {
				return fmt.Errorf("light tag: %w", err)
			}
		case strings.HasPrefix(line, "FLAGS"):
			_, err = fmt.Sscanf(line, "FLAGS %d", &p.Flags)
			if err != nil {
				return fmt.Errorf("flags: %w", err)
			}
		case strings.HasPrefix(line, "RADIUSOFINFLUENCE"):
			_, err = fmt.Sscanf(line, "RADIUSOFINFLUENCE %f", &p.Radius)
			if err != nil {
				return fmt.Errorf("radius: %w", err)
			}

		default:
			return fmt.Errorf("unknown property: %s", line)
		}
	}
	return nil
}

// Sprite3DDef is a declaration of SPRITE3DDEF
type Sprite3DDef struct {
	Tag string // 3DSPRITETAG "%s"
	// NUMVERTICES %d
	Vertices [][3]float32 // XYZ %0.7f %0.7f %0.7f
	// NUMBSPNODES %d
	BSPNodes []*BSPNode // BSPNODE
}

func (s *Sprite3DDef) Definition() string {
	return "3DSPRITEDEF"
}

func (s *Sprite3DDef) Write(w io.Writer) error {
	fmt.Fprintf(w, "%s\n", s.Definition())
	fmt.Fprintf(w, "\t3DSPRITETAG \"%s\"\n", s.Tag)
	fmt.Fprintf(w, "\tNUMVERTICES %d\n", len(s.Vertices))
	for _, vert := range s.Vertices {
		fmt.Fprintf(w, "\tXYZ %0.7f %0.7f %0.7f\n", vert[0], vert[1], vert[2])
	}
	fmt.Fprintf(w, "\tNUMBSPNODES %d\n", len(s.BSPNodes))
	for i, node := range s.BSPNodes {
		fmt.Fprintf(w, "\tBSPNODE //%d\n", i+1)
		fmt.Fprintf(w, "\tNUMVERTICES %d\n", len(node.Vertices))
		vertStr := ""
		for _, vert := range node.Vertices {
			vertStr += fmt.Sprintf("%d ", vert)
		}
		if len(vertStr) > 0 {
			vertStr = vertStr[:len(vertStr)-1]
		}
		fmt.Fprintf(w, "\tVERTEXLIST %s\n", vertStr)
		fmt.Fprintf(w, "\tRENDERMETHOD %s\n", node.RenderMethod)
		fmt.Fprintf(w, "\tRENDERINFO\n")
		fmt.Fprintf(w, "\t\tPEN %d\n", node.RenderPen)
		fmt.Fprintf(w, "\tENDRENDERINFO\n")
		if node.FrontTree != 0 {
			fmt.Fprintf(w, "\tFRONTTREE %d\n", node.FrontTree)
		}
		if node.BackTree != 0 {
			fmt.Fprintf(w, "\tBACKTREE %d\n", node.BackTree)
		}
		fmt.Fprintf(w, "ENDBSPNODE\n")
	}
	fmt.Fprintf(w, "END3DSPRITEDEF\n\n")
	return nil
}

func (s *Sprite3DDef) Read(r *AsciiReadToken) error {
	for {
		line, err := r.ReadProperty(s.Definition())
		if err != nil {
			if err == io.EOF {
				break
			}
			return err
		}
		if line == "END3DSPRITEDEF" {
			break
		}
		if line == "" {
			continue
		}
		switch {
		case strings.HasPrefix(line, "3DSPRITETAG"):
			line = strings.ReplaceAll(line, "\"", "")
			_, err = fmt.Sscanf(line, "3DSPRITETAG %s", &s.Tag)
			if err != nil {
				return fmt.Errorf("tag: %w", err)
			}
		case strings.HasPrefix(line, "NUMVERTICES"):
			var numVertices int
			_, err = fmt.Sscanf(line, "NUMVERTICES %d", &numVertices)
			if err != nil {
				return fmt.Errorf("num vertices: %w", err)
			}
			s.Vertices = make([][3]float32, numVertices)
			for i := 0; i < numVertices; i++ {
				line, err = r.ReadProperty(s.Definition())
				if err != nil {
					return err
				}
				if !strings.HasPrefix(line, "XYZ") {
					return fmt.Errorf("expected XYZ, got %s", line)
				}
				line = strings.TrimPrefix(line, "XYZ")
				line = strings.TrimSpace(line)
				records := strings.Split(line, " ")
				if len(records) != 3 {
					return fmt.Errorf("expected 3 records, got %d", len(records))
				}
				for j, record := range records {
					vert, err := strconv.ParseFloat(record, 32)
					if err != nil {
						return fmt.Errorf("vertex: %w", err)
					}
					s.Vertices[i][j] = float32(vert)
				}
			}
		case strings.HasPrefix(line, "NUMBSPNODES"):
			var numBSPNodes int
			_, err = fmt.Sscanf(line, "NUMBSPNODES %d", &numBSPNodes)
			if err != nil {
				return fmt.Errorf("num bsp nodes: %w", err)
			}

			s.BSPNodes = make([]*BSPNode, numBSPNodes)
			for i := 0; i < numBSPNodes; i++ {
				node := &BSPNode{}
				line, err = r.ReadProperty(s.Definition())
				if err != nil {
					return err
				}
				if !strings.HasPrefix(line, "BSPNODE") {
					return fmt.Errorf("expected BSPNODE, got %s", line)
				}
				for {
					line, err = r.ReadProperty(s.Definition())
					if err != nil {
						return err
					}
					if strings.HasPrefix(line, "ENDBSPNODE") {
						break
					}
					if strings.HasPrefix(line, "NUMVERTICES") {
						var numVertices int
						_, err = fmt.Sscanf(line, "NUMVERTICES %d", &numVertices)
						if err != nil {
							return fmt.Errorf("num vertices: %w", err)
						}
						node.Vertices = make([]uint32, numVertices)
						for j := 0; j < numVertices; j++ {
							line, err = r.ReadProperty(s.Definition())
							if err != nil {
								return err
							}
							if !strings.HasPrefix(line, "VERTEXLIST") {
								return fmt.Errorf("expected VERTEXLIST, got %s", line)
							}
							line = strings.TrimPrefix(line, "VERTEXLIST")
							line = strings.TrimSpace(line)
							records := strings.Split(line, " ")
							val, err := strconv.ParseUint(records[0], 10, 32)
							node.Vertices[j] = uint32(val)
							if err != nil {
								return fmt.Errorf("vertex list: %w", err)
							}
						}
					} else if strings.HasPrefix(line, "RENDERMETHOD") {
						line = strings.TrimPrefix(line, "RENDERMETHOD")
						line = strings.TrimSpace(line)
						node.RenderMethod = line
					} else if strings.HasPrefix(line, "RENDERINFO") {
						for {
							line, err = r.ReadProperty(s.Definition())
							if err != nil {
								return err
							}
							if strings.HasPrefix(line, "ENDRENDERINFO") {
								break
							}
							if strings.HasPrefix(line, "PEN") {
								_, err = fmt.Sscanf(line, "PEN %d", &node.RenderPen)
								if err != nil {
									return fmt.Errorf("pen: %w", err)
								}
							}
						}
					} else if strings.HasPrefix(line, "FRONTTREE") {
						_, err = fmt.Sscanf(line, "FRONTTREE %d", &node.FrontTree)
						if err != nil {
							return fmt.Errorf("front tree: %w", err)
						}
					}
				}
				s.BSPNodes[i] = node
			}

		default:
			return fmt.Errorf("unknown property: %s", line)
		}
	}
	return nil
}

// BSPNode is a declaration of BSPNODE
type BSPNode struct {
	// NUMVERTICES %d
	Vertices                    []uint32   // VERTEXLIST %d %d %d %d
	RenderMethod                string     // RENDERMETHOD %s
	RenderFlags                 uint8      // FLAGS %d
	RenderPen                   uint32     // PEN %d
	RenderBrightness            float32    // BRIGHTNESS %0.7f
	RenderScaledAmbient         float32    // SCALEDAMBIENT %0.7f
	RenderSimpleSpriteReference uint32     // SIMPLESPRITEINSTREF %d
	RenderUVInfoOrigin          [3]float32 // ORIGIN %0.7f %0.7f %0.7f
	RenderUVInfoUAxis           [3]float32 // UAXIS %0.7f %0.7f %0.7f
	RenderUVInfoVAxis           [3]float32 // VAXIS %0.7f %0.7f %0.7f
	RenderUVMapEntries          []BspNodeUVInfo
	FrontTree                   uint32 // FRONTTREE %d
	BackTree                    uint32 // BACKTREE %d
}

// BspNodeUVInfo is a declaration of UV
type BspNodeUVInfo struct {
	UvOrigin [3]float32 // UV %0.7f %0.7f %0.7f
	UAxis    [3]float32 // UAXIS %0.7f %0.7f %0.7f
	VAxis    [3]float32 // VAXIS %0.7f %0.7f %0.7f
}

/*
	3DSPRITEDEF
		3DSPRITETAG "merPolyset#22"
		NUMVERTICES 13
		XYZ  0.853552 -0.387270 0.132829
		XYZ  0.853552 -0.387270 -0.0764756
		XYZ  0.669943 -0.387270 -0.0764756
		XYZ  0.669943 -0.387270 0.132829
		XYZ  0.520097 0.625145 0.263453
		XYZ  0.741984 0.789095 -0.104524
		XYZ  0.520097 0.625145 -0.213762
		XYZ  0.956755 0.625145 0.263453
		XYZ  0.956755 0.625145 -0.213762
		XYZ  1.03165 -0.391053 0.272626
		XYZ  1.03165 -0.391053 -0.251556
		XYZ  0.507472 -0.391053 0.272626
		XYZ  0.507472 -0.391053 -0.251556
		NUMBSPNODES 10
		BSPNODE  1
			NUMVERTICES 4
			VERTEXLIST  1, 2, 3, 4
			RENDERMETHOD  SOLIDFILLAMBIENTGOURAUD1
			RENDERINFO
				PEN  11  // RGBPEN  0, 0, 0
				BRIGHTNESS  0.750000
				SCALEDAMBIENT  1.00000
			ENDRENDERINFO
			FRONTTREE  2
			BACKTREE  3
		ENDBSPNODE  1
		BSPNODE  2
			NUMVERTICES 4
			VERTEXLIST  10, 11, 13, 12
			RENDERMETHOD  TEXTURE4AMBIENT
			RENDERINFO
				PEN  156  // RGBPEN  0, 150, 255
				BRIGHTNESS  0.750000
				SCALEDAMBIENT  1.00000
				SIMPLESPRITEINST
					TAG "msleve_SPRITE"
				ENDSIMPLESPRITEINST
				UVORIGIN  0.219274 -0.391053 -0.0851645
				UAXIS  1.0       0.986040        0.00000      -0.569290
				VAXIS  1.0        0.00000        0.00000        0.00000
				UV  0.460789 0.00000
				UV  0.690980 0.00000
				UV  0.292278 0.00000
				UV  0.0620874 0.00000
			ENDRENDERINFO
			FRONTTREE  0
			BACKTREE  0
		ENDBSPNODE  2
		SPHERELIST
		DEFINITION  "merPolyset#22_BOUNDS"
	ENDSPHERELIST
	BOUNDINGRADIUS 1.17286
END3DSPRITEDEF */

/*
POLYHEDRONDEFINITION

	TAG	"prepe_POLYHDEF"
	BOUNDINGRADIUS	1.2431762e+002
	SCALEFACTOR	1.0
	NUMVERTICES	287
	XYZ	-5.9604645e-008 1.9073486e-005 -3.8146973e-006
	NUMFACES	280
	FACE 1
		NUMVERTICES	3
		VERTEXLIST	3, 1, 2
	ENDFACE 1
	ENDPOLYHEDRONDEFINITION
*/
type PolyhedronDefinition struct {
	Tag            string
	BoundingRadius float32
	ScaleFactor    float32
	numVertices    int // NUMVERTICES %d
	Vertices       [][3]float32
	numFaces       int // NUMFACES %d
	Faces          []*PolyhedronDefinitionFace
}

type PolyhedronDefinitionFace struct {
	numVertices int // NUMVERTICES %d
	Vertices    []uint32
}

func (p *PolyhedronDefinition) Definition() string {
	return "POLYHEDRONDEFINITION"
}

func (p *PolyhedronDefinition) Write(w io.Writer) error {
	fmt.Fprintf(w, "%s\n", p.Definition())
	fmt.Fprintf(w, "\tTAG \"%s\"\n", p.Tag)
	fmt.Fprintf(w, "\tBOUNDINGRADIUS %0.7f\n", p.BoundingRadius)
	fmt.Fprintf(w, "\tSCALEFACTOR %0.7f\n", p.ScaleFactor)
	fmt.Fprintf(w, "\tNUMVERTICES %d\n", len(p.Vertices))
	for _, vert := range p.Vertices {
		fmt.Fprintf(w, "\tXYZ %0.7f %0.7f %0.7f\n", vert[0], vert[1], vert[2])
	}
	fmt.Fprintf(w, "\tNUMFACES %d\n", len(p.Faces))
	for i, face := range p.Faces {
		fmt.Fprintf(w, "\tFACE %d\n", i+1)
		fmt.Fprintf(w, "\t\tNUMVERTICES %d\n", len(face.Vertices))
		vertStr := ""
		for _, vert := range face.Vertices {
			vertStr += fmt.Sprintf("%d, ", vert)
		}
		if len(vertStr) > 0 {
			vertStr = vertStr[:len(vertStr)-2]
		}
		fmt.Fprintf(w, "\t\tVERTEXLIST %s\n", vertStr)
		fmt.Fprintf(w, "\tENDFACE %d\n", i+1)
	}
	fmt.Fprintf(w, "ENDPOLYHEDRONDEFINITION\n\n")
	return nil
}

func (p *PolyhedronDefinition) Read(r *AsciiReadToken) error {
	for {
		line, err := r.ReadProperty(p.Definition())
		if err != nil {
			if err == io.EOF {
				break
			}
			return err
		}
		if line == "ENDPOLYHEDRONDEFINITION" {
			return nil
		}
		if line == "" {
			continue
		}
		switch {
		case strings.HasPrefix(line, "TAG"):
			line = strings.ReplaceAll(line, "\"", "")
			_, err = fmt.Sscanf(line, "TAG %s", &p.Tag)
			if err != nil {
				return fmt.Errorf("%s: %w", line, err)
			}
		case strings.HasPrefix(line, "BOUNDINGRADIUS"):
			valStr := ""
			_, err = fmt.Sscanf(line, "BOUNDINGRADIUS %s", &valStr)
			if err != nil {
				return fmt.Errorf("%s: %w", line, err)
			}
			val, err := strconv.ParseFloat(valStr, 32)
			if err != nil {
				return fmt.Errorf("%s: %w", line, err)
			}
			p.BoundingRadius = float32(val)
		case strings.HasPrefix(line, "SCALEFACTOR"):
			valStr := ""
			_, err = fmt.Sscanf(line, "SCALEFACTOR %s", &valStr)
			if err != nil {
				return fmt.Errorf("%s: %w", line, err)
			}
			val, err := strconv.ParseFloat(valStr, 32)
			if err != nil {
				return fmt.Errorf("%s: %w", line, err)
			}
			p.ScaleFactor = float32(val)
		case strings.HasPrefix(line, "NUMVERTICES"):
			_, err = fmt.Sscanf(line, "NUMVERTICES %d", &p.numVertices)
			if err != nil {
				return fmt.Errorf("%s: %w", line, err)
			}
			p.Vertices = make([][3]float32, p.numVertices)
			for i := 0; i < p.numVertices; i++ {
				line, err = r.ReadProperty(p.Definition())
				if err != nil {
					return err
				}
				valStr1, valStr2, valStr3 := "", "", ""
				_, err = fmt.Sscanf(line, "XYZ %s %s %s", &valStr1, &valStr2, &valStr3)
				if err != nil {
					return fmt.Errorf("vertex %d: %w", i, err)
				}
				val1, err := strconv.ParseFloat(valStr1, 32)
				if err != nil {
					return fmt.Errorf("vertex %d: %w", i, err)
				}
				val2, err := strconv.ParseFloat(valStr2, 32)
				if err != nil {
					return fmt.Errorf("vertex %d: %w", i, err)
				}
				val3, err := strconv.ParseFloat(valStr3, 32)
				if err != nil {
					return fmt.Errorf("vertex %d: %w", i, err)
				}
				p.Vertices[i] = [3]float32{float32(val1), float32(val2), float32(val3)}
			}
		case strings.HasPrefix(line, "NUMFACES"):
			_, err = fmt.Sscanf(line, "NUMFACES %d", &p.numFaces)
			if err != nil {
				return fmt.Errorf("%s: %w", line, err)
			}
			p.Faces = make([]*PolyhedronDefinitionFace, p.numFaces)
			for i := 0; i < p.numFaces; i++ {
				line, err = r.ReadProperty(p.Definition())
				if err != nil {
					return err
				}
				if line == "" {
					continue
				}
				if !strings.HasPrefix(line, "FACE") {
					return fmt.Errorf("expected FACE %d, got %s", i+1, line)
				}
				face := &PolyhedronDefinitionFace{}
				_, err = fmt.Sscanf(line, "FACE %d", &face.numVertices)
				if err != nil {
					return fmt.Errorf("face %d: %w", i+1, err)
				}
				face.Vertices = make([]uint32, face.numVertices)
				line, err = r.ReadProperty(p.Definition())
				if err != nil {
					return err
				}
				if line == "" {
					continue
				}
				if !strings.HasPrefix(line, "NUMVERTICES") {
					return fmt.Errorf("expected FACE %d NUMVERTICES, got %s", i+1, line)
				}
				numVertices := 0
				_, err = fmt.Sscanf(line, "NUMVERTICES %d", &numVertices)
				if err != nil {
					return fmt.Errorf("face %d numvertices: %w", i+1, err)
				}
				face.Vertices = make([]uint32, numVertices)
				line, err = r.ReadProperty(p.Definition())
				if err != nil {
					return err
				}
				if line == "" {
					continue
				}
				if !strings.HasPrefix(line, "VERTEXLIST") {
					return fmt.Errorf("expected VERTEXLIST, got %s", line)
				}

				vertStr := strings.Split(strings.TrimSpace(strings.TrimPrefix(line, "VERTEXLIST")), ",")
				if len(vertStr) != numVertices {
					return fmt.Errorf("face %d: expected %d vertices, got %d", i+1, numVertices, len(vertStr))
				}
				for k, v := range vertStr {
					v = strings.TrimSpace(v)
					val, err := strconv.ParseUint(v, 10, 32)
					if err != nil {
						return fmt.Errorf("face %d element %d: %w", i+1, k, err)
					}
					face.Vertices[k] = uint32(val)
				}
				line, err = r.ReadProperty(p.Definition())
				if err != nil {
					return err
				}
				if line == "" {
					continue
				}
				if !strings.HasPrefix(line, "ENDFACE") {
					return fmt.Errorf("expected ENDFACE %d, got %s", i, line)
				}
				p.Faces[i] = face
			}

		default:
			return fmt.Errorf("unknown property: %s", line)
		}
	}
	return nil
}

type TrackInstance struct {
	Tag            string // TAG "%s"
	DefiniationTag string // DEFINITION "%s"
	isInterpolated bool   // INTERPOLATE
	Sleep          uint32 // SLEEP %d
}

func (t *TrackInstance) Definition() string {
	return "TRACKINSTANCE"
}

func (t *TrackInstance) Write(w io.Writer) error {
	fmt.Fprintf(w, "%s\n", t.Definition())
	fmt.Fprintf(w, "\tTAG \"%s\"\n", t.Tag)
	fmt.Fprintf(w, "\tDEFINITION \"%s\"\n", t.DefiniationTag)
	if t.isInterpolated {
		fmt.Fprintf(w, "\tINTERPOLATE\n")
	}
	fmt.Fprintf(w, "\tSLEEP %d\n", t.Sleep)
	fmt.Fprintf(w, "ENDTRACKINSTANCE\n\n")
	return nil
}

func (t *TrackInstance) Read(r *AsciiReadToken) error {
	for {
		line, err := r.ReadProperty(t.Definition())
		if err != nil {
			if err == io.EOF {
				break
			}
			return err

		}
		if line == "ENDTRACKINSTANCE" {
			break
		}
		if line == "" {
			continue
		}
		switch {
		case strings.HasPrefix(line, "TAG"):
			line = strings.ReplaceAll(line, "\"", "")
			_, err = fmt.Sscanf(line, "TAG %s", &t.Tag)
			if err != nil {
				return fmt.Errorf("%s: %w", line, err)
			}
		case strings.HasPrefix(line, "DEFINITION"):
			line = strings.ReplaceAll(line, "\"", "")
			_, err = fmt.Sscanf(line, "DEFINITION %s", &t.DefiniationTag)
			if err != nil {
				return fmt.Errorf("%s: %w", line, err)
			}
		case strings.HasPrefix(line, "INTERPOLATE"):
			t.isInterpolated = true
		case strings.HasPrefix(line, "SLEEP"):
			_, err = fmt.Sscanf(line, "SLEEP %d", &t.Sleep)
			if err != nil {
				return fmt.Errorf("%s: %w", line, err)
			}
		default:
			return fmt.Errorf("unknown property: %s", line)
		}
	}
	return nil
}

type TrackDef struct {
	Tag            string                // TAG "%s"
	numFrames      int                   // NUMFRAMES %d
	FrameTransform []TrackFrameTransform // FRAMETRANSFORM %0.7f %d %d %d %0.7f %0.7f %0.7f
}

type TrackFrameTransform struct {
	LocDenom float32
	Rotation [3]int32
	Position [3]float32
}

func (t *TrackDef) Definition() string {
	return "TRACKDEFINITION"
}

func (t *TrackDef) Write(w io.Writer) error {
	fmt.Fprintf(w, "%s\n", t.Definition())
	fmt.Fprintf(w, "\tTAG \"%s\"\n", t.Tag)
	fmt.Fprintf(w, "\tNUMFRAMES %d\n", t.numFrames)
	for _, frame := range t.FrameTransform {
		fmt.Fprintf(w, "\tFRAMETRANSFORM %0.7f %d %d %d %0.7f %0.7f %0.7f\n", frame.LocDenom, frame.Rotation[0], frame.Rotation[1], frame.Rotation[2], frame.Position[0], frame.Position[1], frame.Position[2])
	}
	fmt.Fprintf(w, "ENDTRACKDEFINITION\n\n")
	return nil
}

func (t *TrackDef) Read(r *AsciiReadToken) error {
	for {
		line, err := r.ReadProperty(t.Definition())
		if err != nil {
			if err == io.EOF {
				break
			}
			return err
		}
		if line == "ENDTRACKDEFINITION" {
			break
		}
		if line == "" {
			continue
		}
		switch {
		case strings.HasPrefix(line, "TAG"):
			line = strings.ReplaceAll(line, "\"", "")
			_, err = fmt.Sscanf(line, "TAG %s", &t.Tag)
			if err != nil {
				return fmt.Errorf("%s: %w", line, err)
			}
		case strings.HasPrefix(line, "NUMFRAMES"):
			_, err = fmt.Sscanf(line, "NUMFRAMES %d", &t.numFrames)
			if err != nil {
				return fmt.Errorf("%s: %w", line, err)
			}
		case strings.HasPrefix(line, "FRAMETRANSFORM"):
			frame := TrackFrameTransform{}
			line = strings.TrimPrefix(line, "FRAMETRANSFORM")
			line = strings.TrimSpace(line)
			records := strings.Split(line, " ")
			finalRecords := []string{}
			for i, record := range records {
				records[i] = strings.TrimSpace(record)
				if records[i] != "" {
					finalRecords = append(finalRecords, records[i])
				}
			}
			records = finalRecords

			if len(records) != 7 {
				return fmt.Errorf("expected 7 records, got %d", len(records))
			}
			locDenom, err := strconv.ParseFloat(strings.TrimSpace(records[0]), 32)
			if err != nil {
				return fmt.Errorf("loc denom (entry 0): %w", err)
			}
			frame.LocDenom = float32(locDenom)

			//Next 3 integer values are euler angles which are converted to a quaternion in the binary
			val, err := strconv.ParseInt(strings.TrimSpace(records[1]), 10, 32)
			if err != nil {
				return fmt.Errorf("rotation x (entry 1): %w", err)
			}
			frame.Rotation[0] = int32(val)
			val, err = strconv.ParseInt(strings.TrimSpace(records[2]), 10, 32)
			if err != nil {
				return fmt.Errorf("rotation y (entry 2): %w", err)
			}
			frame.Rotation[1] = int32(val)
			val, err = strconv.ParseInt(strings.TrimSpace(records[3]), 10, 32)
			if err != nil {
				return fmt.Errorf("rotation z (entry 3): %w", err)
			}
			frame.Rotation[2] = int32(val)

			valF, err := strconv.ParseFloat(strings.TrimSpace(records[4]), 32)
			if err != nil {
				return fmt.Errorf("position x (entry 4): %w", err)
			}
			frame.Position[0] = float32(valF)

			valF, err = strconv.ParseFloat(strings.TrimSpace(records[5]), 32)
			if err != nil {
				return fmt.Errorf("position y (entry 5): %w", err)
			}
			frame.Position[1] = float32(valF)

			valF, err = strconv.ParseFloat(strings.TrimSpace(records[6]), 32)
			if err != nil {
				return fmt.Errorf("position z (entry 6): %w", err)
			}
			frame.Position[2] = float32(valF)

			t.FrameTransform = append(t.FrameTransform, frame)

		default:
			return fmt.Errorf("unknown property: %s", line)
		}
	}
	return nil
}

type HierarchicalSpriteDef struct {
	Tag            string         // TAG "%s"
	Dags           []Dag          // DAG
	AttachedSkins  []AttachedSkin // ATTACHEDSKIN
	CenterOffset   [3]float32     // CENTEROFFSET %0.7f %0.7f %0.7f
	BoundingRadius float32        // BOUNDINGRADIUS %0.7f
	HasCollisions  bool           // DAGCOLLISIONS
}

type Dag struct {
	Tag     string   // TAG "%s"
	Flags   uint32   // NULLSPRITE, etc
	Track   string   // TRACK "%s"
	SubDags []uint32 // SUBDAGLIST %d %d
}

type AttachedSkin struct {
	Tag                       string // TAG "%s"
	LinkSkinUpdatesToDagIndex uint32 // LINKSKINUPDATES %d
}

func (h *HierarchicalSpriteDef) Definition() string {
	return "HIERARCHICALSPRITEDEF"
}

func (h *HierarchicalSpriteDef) Write(w io.Writer) error {
	fmt.Fprintf(w, "%s\n", h.Definition())
	fmt.Fprintf(w, "\tTAG \"%s\"\n", h.Tag)
	fmt.Fprintf(w, "\tNUMDAGS %d\n", len(h.Dags))
	for i, dag := range h.Dags {
		fmt.Fprintf(w, "\tDAG // %d\n", i+1)
		fmt.Fprintf(w, "\t\tTAG \"%s\"\n", dag.Tag)
		if dag.Flags != 0 {
			fmt.Fprintf(w, "\t\tFLAGS %d\n", dag.Flags)
		}
		if dag.Track != "" {
			fmt.Fprintf(w, "\t\tTRACK \"%s\"\n", dag.Track)
		}
		if len(dag.SubDags) > 0 {
			fmt.Fprintf(w, "\t\tNUMSUBDAGS %d\n", len(dag.SubDags))
			fmt.Fprintf(w, "\t\tSUBDAGLIST")
			for _, subDag := range dag.SubDags {
				fmt.Fprintf(w, " %d", subDag)
			}
			fmt.Fprintf(w, "\n")
		}
		fmt.Fprintf(w, "\tENDDAG // %d\n", i+1)
	}
	if len(h.Dags) > 0 {
		fmt.Fprintf(w, "\n")
	}
	if len(h.AttachedSkins) > 0 {
		fmt.Fprintf(w, "\tNUMATTACHEDSKINS %d\n", len(h.AttachedSkins))
		for _, skin := range h.AttachedSkins {
			fmt.Fprintf(w, "\tDMSPRITE \"%s\"\n", skin.Tag)
			fmt.Fprintf(w, "\tLINKSKINUPDATESTODAGINDEX %d\n", skin.LinkSkinUpdatesToDagIndex)
		}
		fmt.Fprintf(w, "\n")
	}

	if h.HasCollisions {
		fmt.Fprintf(w, "\tDAGCOLLISIONS\n")
	}
	fmt.Fprintf(w, "\tCENTEROFFSET %0.1f %0.1f %0.1f\n", h.CenterOffset[0], h.CenterOffset[1], h.CenterOffset[2])
	fmt.Fprintf(w, "\tBOUNDINGRADIUS %0.7f\n", h.BoundingRadius)

	fmt.Fprintf(w, "ENDHIERARCHICALSPRITEDEF\n\n")
	return nil
}

func (h *HierarchicalSpriteDef) Read(r *AsciiReadToken) error {
	for {
		line, err := r.ReadProperty(h.Definition())
		if err != nil {
			if err == io.EOF {
				break
			}
			return err
		}
		if line == "ENDHIERARCHICALSPRITEDEF" {
			break
		}
		if line == "" {
			continue
		}
		switch {
		case strings.HasPrefix(line, "TAG"):
			line = strings.ReplaceAll(line, "\"", "")
			_, err = fmt.Sscanf(line, "TAG %s", &h.Tag)
			if err != nil {
				return fmt.Errorf("%s: %w", line, err)
			}
		case strings.HasPrefix(line, "NUMDAGS"):
			numDags := 0
			_, err = fmt.Sscanf(line, "NUMDAGS %d", &numDags)
			if err != nil {
				return fmt.Errorf("%s: %w", line, err)
			}
			h.Dags = make([]Dag, numDags)
			for i := 0; i < numDags; i++ {
				line, err = r.ReadProperty(h.Definition())
				if err != nil {
					return fmt.Errorf("read dag %d: %w", i+1, err)
				}
				if line == "" {
					i--
					continue
				}
				if !strings.HasPrefix(line, "DAG") {
					return fmt.Errorf("expected DAG %d, got %s", i+1, line)
				}
				dag := Dag{}
				for {
					line, err = r.ReadProperty(h.Definition())
					if err != nil {
						return fmt.Errorf("dag %d: %w", i+1, err)
					}
					if line == "" {
						continue
					}
					if strings.HasPrefix(line, "ENDDAG") {
						break
					}
					switch {
					case strings.HasPrefix(line, "TAG"):
						line = strings.ReplaceAll(line, "\"", "")
						_, err = fmt.Sscanf(line, "TAG %s", &dag.Tag)
						if err != nil {
							return fmt.Errorf("dag %d: %w", i+1, err)
						}
					case strings.HasPrefix(line, "FLAGS"):
						_, err = fmt.Sscanf(line, "FLAGS %d", &dag.Flags)
						if err != nil {
							return fmt.Errorf("dag %d: %w", i+1, err)
						}
					case strings.HasPrefix(line, "TRACK"):
						line = strings.ReplaceAll(line, "\"", "")
						_, err = fmt.Sscanf(line, "TRACK %s", &dag.Track)
						if err != nil {
							return fmt.Errorf("dag %d: %w", i+1, err)
						}
					case strings.HasPrefix(line, "NUMSUBDAGS"):
						numSubDags := 0
						_, err = fmt.Sscanf(line, "NUMSUBDAGS %d", &numSubDags)
						if err != nil {
							return fmt.Errorf("dag %d: %w", i+1, err)
						}
						if numSubDags == 0 {
							continue
						}
						dag.SubDags = make([]uint32, numSubDags)
						line, err = r.ReadProperty(h.Definition())
						if err != nil {
							return err
						}
						if line == "" {
							continue
						}
						if !strings.HasPrefix(line, "SUBDAGLIST") {
							return fmt.Errorf("expected SUBDAGLIST, got %s", line)
						}
						subDags := strings.Split(strings.TrimSpace(strings.TrimPrefix(line, "SUBDAGLIST")), " ")
						if len(subDags) != numSubDags {
							return fmt.Errorf("dag %d: expected %d subdags, got %d", i+1, numSubDags, len(subDags))
						}
						for k, v := range subDags {
							v = strings.TrimSpace(v)
							val, err := strconv.ParseUint(v, 10, 32)
							if err != nil {
								return fmt.Errorf("dag %d element %d: %w", i+1, k, err)
							}
							dag.SubDags[k] = uint32(val)
						}
					}
				}
				h.Dags[i] = dag
			}
		case strings.HasPrefix(line, "DAGCOLLISIONS"):
			h.HasCollisions = true
		case strings.HasPrefix(line, "NUMATTACHEDSKINS"):
			numSkins := 0
			_, err = fmt.Sscanf(line, "NUMATTACHEDSKINS %d", &numSkins)
			if err != nil {
				return fmt.Errorf("%s: %w", line, err)
			}
			h.AttachedSkins = make([]AttachedSkin, numSkins)
			for i := 0; i < numSkins; i++ {
				line, err = r.ReadProperty(h.Definition())
				if err != nil {
					return err
				}
				if line == "" {
					continue
				}
				if !strings.HasPrefix(line, "DMSPRITE") {
					return fmt.Errorf("expected DMSPRITE %d, got %s", i+1, line)
				}
				skin := AttachedSkin{}
				line = strings.TrimPrefix(line, "DMSPRITE")
				line = strings.ReplaceAll(line, "\"", "")
				line = strings.TrimSpace(line)
				skin.Tag = line
				h.AttachedSkins[i] = skin
				line, err = r.ReadProperty(h.Definition())
				if err != nil {
					return err
				}
				if line == "" {
					continue
				}
				if !strings.HasPrefix(line, "LINKSKINUPDATESTODAGINDEX") {
					return fmt.Errorf("expected LINKSKINUPDATESTODAGINDEX, got %s", line)
				}
				line = strings.TrimPrefix(line, "LINKSKINUPDATESTODAGINDEX")
				line = strings.TrimSpace(line)
				val, err := strconv.ParseUint(line, 10, 32)
				if err != nil {
					return fmt.Errorf("skin %d: %w", i+1, err)
				}
				h.AttachedSkins[i].LinkSkinUpdatesToDagIndex = uint32(val)

			}
		case strings.HasPrefix(line, "CENTEROFFSET"):
			_, err = fmt.Sscanf(line, "CENTEROFFSET %f %f %f", &h.CenterOffset[0], &h.CenterOffset[1], &h.CenterOffset[2])
			if err != nil {
				return fmt.Errorf("%s: %w", line, err)
			}
		case strings.HasPrefix(line, "BOUNDINGRADIUS"):
			_, err = fmt.Sscanf(line, "BOUNDINGRADIUS %f", &h.BoundingRadius)
			if err != nil {
				return fmt.Errorf("%s: %w", line, err)
			}
		default:
			return fmt.Errorf("unknown property: %s", line)
		}
	}
	return nil
}
