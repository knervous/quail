package obj

import (
	"fmt"
	"io"
	"os"
	"strconv"
	"strings"

	"github.com/xackery/quail/model/geo"
)

func mattxtExport(req *ObjRequest) error {
	w, err := os.Open(req.MattxtPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	defer w.Close()
	data, err := io.ReadAll(w)
	if err != nil {
		return fmt.Errorf("readall: %w", err)
	}
	matches := rePat.FindAllStringSubmatch(string(data), -1)

	for lineNumber, records := range matches {
		if len(records) < 5 {
			return fmt.Errorf("line %d has an invalid number of records", lineNumber)
		}
		records = strings.Split(records[0], " ")

		switch records[0] {
		case "m":
			material := materialByName(records[1], req.Data)
			if material == nil {
				material = &geo.Material{
					Name: records[1],
				}
				req.Data.Materials = append(req.Data.Materials, material)
			}
			material.ShaderName = records[3]
			val, err := strconv.Atoi(records[2])
			if err != nil {
				return fmt.Errorf("line %d parse flag %s: %w", lineNumber, records[2], err)
			}
			material.Flag = uint32(val)
		case "e":
			material := materialByName(records[1], req.Data)
			if material == nil {
				material = &geo.Material{
					Name: records[1],
				}
				req.Data.Materials = append(req.Data.Materials, material)
			}

			val, err := strconv.Atoi(records[3])
			if err != nil {
				return fmt.Errorf("line %d parse material type %s: %w", lineNumber, records[3], err)
			}

			prop := &geo.Property{
				Name:     records[2],
				Category: uint32(val),
				Value:    records[4],
			}
			material.Properties = append(material.Properties, prop)
		default:
			return fmt.Errorf("line %d has an unsupported definition prefix: %s", lineNumber, records[0])
		}
	}
	return nil
}
