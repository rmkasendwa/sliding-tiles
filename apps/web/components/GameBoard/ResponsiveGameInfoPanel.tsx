'use client';

import { GameInfoPanel } from './GameInfoPanel';
import { MobileInfoModalPortal } from './MobileInfoModalPortal';

type ResponsiveGameInfoPanelProps = {
  columns: number;
  gameModeLabel: string;
  highestReachedLevel: number;
  isLevelSelectDisabled: boolean;
  isModalOpen: boolean;
  isModalRendered: boolean;
  isSignedIn: boolean;
  level: number;
  onCloseModal: () => void;
  onRegisterClick: () => void;
  onSelectLevel: (level: number) => void;
  playerAvatarUrl?: string | null;
  playerName?: string;
  rows: number;
};

export function ResponsiveGameInfoPanel({
  columns,
  gameModeLabel,
  highestReachedLevel,
  isLevelSelectDisabled,
  isModalOpen,
  isModalRendered,
  isSignedIn,
  level,
  onCloseModal,
  onRegisterClick,
  onSelectLevel,
  playerAvatarUrl,
  playerName,
  rows,
}: ResponsiveGameInfoPanelProps) {
  const sharedProps = {
    columns,
    gameModeLabel,
    highestReachedLevel,
    isLevelSelectDisabled,
    isSignedIn,
    level,
    onSelectLevel,
    onRegisterClick,
    playerAvatarUrl,
    playerName,
    rows,
  };

  return (
    <>
      <aside className="play-panel-reveal sticky top-4 max-[900px]:hidden">
        <GameInfoPanel {...sharedProps} />
      </aside>
      {isModalRendered ? (
        <MobileInfoModalPortal isOpen={isModalOpen} onClose={onCloseModal}>
          <GameInfoPanel {...sharedProps} isModal onClose={onCloseModal} />
        </MobileInfoModalPortal>
      ) : null}
    </>
  );
}
