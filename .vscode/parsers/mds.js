registerFileType((fileExt, filePath, fileData) => {
	// Check for wav extension
	if (fileExt == 'mds') {
		const headerArray = fileData.getBytesAt(0, 4);
		const header = String.fromCharCode(...headerArray)
		if (header == 'EQGS')
			return true;
	}
	return false;
});

registerParser(() => {
	// Parse
	read(4);
	addRow('Header', getStringValue(), 'header (EQGS)');
	read(4);
	addRow('Version', getNumberValue(), 'version (1, 2, 3)');
	read(4);
	const nameLength = getNumberValue();
	addRow('Name', nameLength, 'name length');
	read(4);
	const materialCount = getNumberValue();
	addRow('Material Count', materialCount, 'material count');
	read(4);
	const verticesCount = getNumberValue();
	addRow('Vertices Count', verticesCount, 'vertices count');
	read(4);
	const trianglesCount = getNumberValue();
	addRow('Triangles Count', trianglesCount, 'triangles count');
	read(4);
	const bonesCount = getNumberValue();
	addRow('Bones Count', bonesCount, 'bones count');
});