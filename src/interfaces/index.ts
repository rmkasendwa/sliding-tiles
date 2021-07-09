export type ISlot = [number, number];
export interface ITile {
  slot: ISlot;
  dimensions: { width: number; height: number };
  background: {
    image: string;
    size: string;
  };
  position: {
    x: number;
    y: number;
  };
}
