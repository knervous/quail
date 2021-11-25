package s3d

// S3D represents a classic everquest zone archive format
type S3D struct {
	ShortName                string
	Files                    []*FileEntry
	directoryChunks          []*ChunkEntry
	directoryChunksTotalSize uint32
}

type FileEntry struct {
	Name            string
	Data            []byte
	CRC             uint32
	Offset          uint32
	chunks          []*ChunkEntry
	chunksTotalSize uint32
	filePointer     uint32
}

type ChunkEntry struct {
	deflatedSize int32
	inflatedSize int32
	data         []byte
}

type ByOffset []*FileEntry

func (s ByOffset) Len() int {
	return len(s)
}

func (s ByOffset) Swap(i, j int) {
	s[i], s[j] = s[j], s[i]
}

func (s ByOffset) Less(i, j int) bool {
	return s[i].Offset < s[j].Offset
}

type ByCRC []*FileEntry

func (s ByCRC) Len() int {
	return len(s)
}

func (s ByCRC) Swap(i, j int) {
	s[i], s[j] = s[j], s[i]
}

func (s ByCRC) Less(i, j int) bool {
	return s[i].CRC < s[j].CRC
}
