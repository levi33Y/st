export enum TabsEnum {
  MemberList = "管理成員",
}

export enum TabsRoleEnum {
  Main = "主持人",
  CoMain = "聯席主持人",
  Member = "參會人",
}

export interface IRoomTabItemProps {
  title: string;
  name: TabsEnum;
}

export interface IEditableTabsProps {
  title: string;
  name: TabsEnum;
}
