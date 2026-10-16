export type AppId =
  | 'jules'
  | 'putty'
  | 'promptlab'
  | 'notebook'
  | 'musicfx'
  | 'doodle'
  | 'terminal'
  | 'settings'
  | 'files'
  | 'science'
  | 'brainstormer'
  | 'arcade'
  | 'ascii'
  | 'miniapps';

export interface AppConfig {
  id: AppId;
  title: string;
  shortTitle: string;
  icon: string;
  color: string;
  defaultWidth: number;
  defaultHeight: number;
}

export type SnapZone =
  | 'left'
  | 'right'
  | 'top'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface WindowState {
  id: AppId;
  title: string;
  icon: string;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  prevPosition?: {
    x: number;
    y: number;
  };
  prevSize?: {
    width: number;
    height: number;
  };
  snappedZone?: SnapZone | null;
}

export interface WallpaperPreset {
  id: string;
  name: string;
  style: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warn';
}
