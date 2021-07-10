export type ISlot = [number, number];
export interface ITile {
  slot: ISlot;
  type?: 'PLACEHOLDER' | 'MOVE_HINT' | 'SLOT_HINT';
  dimensions: { width: number; height: number };
  background: {
    image: string;
    size: string;
    position: string;
  };
}
