package ani

import (
	"encoding/binary"
	"fmt"
	"io"

	"github.com/xackery/quail/dump"
)

func (e *ANI) Load(r io.ReadSeeker) error {
	var err error
	header := [4]byte{}
	err = binary.Read(r, binary.LittleEndian, &header)
	if err != nil {
		return fmt.Errorf("read header: %w", err)
	}
	dump.Hex(header, "header=%s", header)
	if header != [4]byte{'E', 'Q', 'G', 'A'} {
		return fmt.Errorf("header does not match EQGM")
	}

	version := uint32(0)
	err = binary.Read(r, binary.LittleEndian, &version)
	if err != nil {
		return fmt.Errorf("read version: %w", err)
	}
	dump.Hex(version, "version=%d", version)

	nameLength := uint32(0)
	err = binary.Read(r, binary.LittleEndian, &nameLength)
	if err != nil {
		return fmt.Errorf("read nameLength: %w", err)
	}
	dump.Hex(nameLength, "nameLength=%d", nameLength)

	animationCount := uint32(0)
	err = binary.Read(r, binary.LittleEndian, &animationCount)
	if err != nil {
		return fmt.Errorf("read animationCount: %w", err)
	}
	dump.Hex(animationCount, "animationCount=%d", animationCount)

	flags := uint32(0)
	err = binary.Read(r, binary.LittleEndian, &flags)
	if err != nil {
		return fmt.Errorf("read flags: %w", err)
	}
	dump.Hex(flags, "flags=%d", flags)

	nameData := make([]byte, nameLength)
	err = binary.Read(r, binary.LittleEndian, &nameData)
	if err != nil {
		return fmt.Errorf("read nameData: %w", err)
	}
	dump.Hex(nameData, "nameData=(%d bytes)", len(nameData))

	names := make(map[uint32]string)
	chunk := []byte{}
	lastOffset := 0
	for i, b := range nameData {
		if b == 0 {
			names[uint32(lastOffset)] = string(chunk)
			chunk = []byte{}
			lastOffset = i + 1
		}
		chunk = append(chunk, b)
	}
	fmt.Printf("%+v", names)

	for i := 0; i < int(animationCount); i++ {
		bone := &Bone{}

		err = binary.Read(r, binary.LittleEndian, bone)
		if err != nil {
			return fmt.Errorf("read bone %d: %w", i, err)
		}
		dump.Hex(chunk, "%dbone(%d %0.2f, %0.2f, %0.2f)", i, bone.Delay, bone.Translation[0], bone.Translation[1], bone.Translation[2])
		e.bones = append(e.bones, bone)
	}

	return nil
}