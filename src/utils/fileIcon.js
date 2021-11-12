const FILE_MAP = {
'file-cad': ['DWG', 'DXF', 'DGN', 'STL', 'DC3', 'BDC', 'ADI', 'MODEL', 'EPF', 'DC2', 'SIM', 'LCF'],
'file-image-marker': ['SVG', 'AI', 'EPS', 'SVGZ', 'FCM', 'CDR', 'VSD', 'DRW'],
'file-image': ['JPG', 'JPEG', 'JPEG2000', 'PNG', 'GIF', 'WEBP', 'TIF', 'TIFF', 'PSD', 'RAW', 'BMP', 'HEIF', 'INDD']
}
// TODO
// file-certificate
// file-chart
// file-cloud
// file-code
// file-cog
// file-delimited
// file-document
// file-excel
// file-lock
// file-music
// file-pdf
// file-percent
// file-font
// file-powerpoint
// file-sign
// file-star
// file-table
// file-video
// file-word
// zip-box
const FILE_ICON_FALLBACK = 'mdi-file';

export const getIconByType = (fileExt) => {
    const upperCasedFileExt = fileExt.toUpperCase();
    for (icon in FILE_MAP){
        if(FILE_MAP[icon].contains(upperCasedFileExt)) return icon
    }
    return FILE_ICON_FALLBACK
}

const EXTENSIONS_WITH_PREVIEW = ['JPG', 'PNG', 'GIF', 'WEBP'];

export const isImageFile = (fileExt) => {
    const upperCasedFileExt = fileExt.toUpperCase();
    return EXTENSIONS_WITH_PREVIEW.contains(upperCasedFileExt)
}

