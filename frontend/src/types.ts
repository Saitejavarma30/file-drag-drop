export interface Item {
  _id: string;
  title: string;
  icon: string;
  folderId: string | null;
  order: number;
}

export interface Folder {
  _id: string;
  name: string;
  isOpen: boolean;
  order: number;
}
