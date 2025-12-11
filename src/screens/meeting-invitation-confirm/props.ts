export interface ITreeDataProps {
  id: string;
  label: string;
  isStaff: boolean;
  disabled?: boolean;
  avatarUrl?: string;
  children?: ITreeDataProps[];
}
