export interface ITreeDataProps {
  id: string;
  label: string;
  isStaff: boolean;
  avatarUrl?: string;
  children?: ITreeDataProps[];
}
