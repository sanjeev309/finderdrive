
import { clsx } from 'clsx';
import type { DriveFile } from '../../types';

// Import icons
import folderIcon from '../../assets/icons/folder.png';
import fileGenericIcon from '../../assets/icons/file_generic.png';
import fileTextIcon from '../../assets/icons/file_text.png';
import fileImageIcon from '../../assets/icons/file_image.png';
import fileVideoIcon from '../../assets/icons/file_video.png';
import fileAudioIcon from '../../assets/icons/file_audio.png';
import filePdfIcon from '../../assets/icons/file_pdf.png';
import fileSpreadsheetIcon from '../../assets/icons/file_spreadsheet.png';
import fileCodeIcon from '../../assets/icons/file_code.png';
import fileArchiveIcon from '../../assets/icons/file_archive.png';

interface FileIconProps {
    file: DriveFile;
    className?: string;
}

export function FileIcon({ file, className }: FileIconProps) {
    const imgClass = clsx("object-contain", className);

    if (file.isFolder) {
        return <img src={folderIcon} alt="Folder" className={imgClass} />;
    }

    const { mimeType } = file;

    if (mimeType.startsWith('image/')) {
        return <img src={fileImageIcon} alt="Image" className={imgClass} />;
    }

    if (mimeType.startsWith('video/')) {
        return <img src={fileVideoIcon} alt="Video" className={imgClass} />;
    }

    if (mimeType.startsWith('audio/')) {
        return <img src={fileAudioIcon} alt="Audio" className={imgClass} />;
    }

    switch (mimeType) {
        case 'application/pdf':
            return <img src={filePdfIcon} alt="PDF" className={imgClass} />;
        case 'application/vnd.google-apps.document':
        case 'application/rtf':
        case 'text/plain':
            return <img src={fileTextIcon} alt="Document" className={imgClass} />;
        case 'application/vnd.google-apps.spreadsheet':
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        case 'text/csv':
            return <img src={fileSpreadsheetIcon} alt="Spreadsheet" className={imgClass} />;
        case 'application/vnd.google-apps.presentation':
        case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
            return <img src={fileGenericIcon} alt="Presentation" className={imgClass} />;
        case 'application/zip':
        case 'application/x-zip-compressed':
        case 'application/x-rar-compressed':
        case 'application/x-7z-compressed':
        case 'application/x-tar':
        case 'application/gzip':
            return <img src={fileArchiveIcon} alt="Archive" className={imgClass} />;
        case 'text/html':
        case 'application/json':
        case 'text/javascript':
        case 'application/javascript':
        case 'text/x-typescript':
        case 'application/xml':
        case 'text/css':
        case 'text/x-python':
        case 'text/x-java':
            return <img src={fileCodeIcon} alt="Code" className={imgClass} />;
        default:
            return <img src={fileGenericIcon} alt="File" className={imgClass} />;
    }
}
