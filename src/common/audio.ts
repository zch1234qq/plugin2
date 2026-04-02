export type RefLike<T> = { current: T };

type AudioRegistryLike = {
  registerAudioResource: (audio: HTMLAudioElement) => void;
};

export type PlaySoundOptions = {
  src: string;
  audioRef?: RefLike<HTMLAudioElement | null>;
  cleanupRegistry?: AudioRegistryLike | RefLike<AudioRegistryLike>;
  volume?: number;
  resetBeforePlay?: boolean;
  onError?: (error: unknown) => void;
};

function unwrapRef<T>(maybeRef: T | RefLike<T>): T {
  if (maybeRef && typeof maybeRef === 'object' && 'current' in (maybeRef as any)) {
    return (maybeRef as RefLike<T>).current;
  }
  return maybeRef as T;
}

export function playSound({
  src,
  audioRef,
  cleanupRegistry,
  volume,
  resetBeforePlay = true,
  onError,
}: PlaySoundOptions): HTMLAudioElement {
  const prev = audioRef?.current ?? null;
  if (prev && resetBeforePlay) {
    try {
      prev.pause();
      prev.currentTime = 0;
    } catch {
      // ignore
    }
  }

  const audio = new Audio(src);
  if (typeof volume === 'number') {
    audio.volume = volume;
  }

  if (audioRef) {
    audioRef.current = audio;
  }

  const registry = cleanupRegistry ? unwrapRef(cleanupRegistry) : undefined;
  registry?.registerAudioResource(audio);

  const handleError = (error: unknown) => {
    if (onError) onError(error);
    else console.error('音频播放失败:', error);
  };

  try {
    const p = audio.play();
    if (p && typeof (p as any).catch === 'function') {
      (p as Promise<void>).catch(handleError);
    }
  } catch (error) {
    handleError(error);
  }

  return audio;
}

