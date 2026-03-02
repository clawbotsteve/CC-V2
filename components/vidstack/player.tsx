import '@vidstack/react/player/styles/base.css';

import {
  isHLSProvider,
  MediaPlayer,
  MediaProvider,
  Poster,
  Track,
  type MediaCanPlayDetail,
  type MediaCanPlayEvent,
  type MediaPlayerInstance,
  type MediaProviderAdapter,
  type MediaProviderChangeEvent,
} from '@vidstack/react';

import { useEffect, useRef } from 'react';
import { VideoLayout } from '@/components/vidstack/layouts/video-layout';

type TrackProps = {
  src: string;
  kind: TextTrackKind;
  label?: string;
  srclang?: string;
  default?: boolean;
};

type PlayerProps = {
  src: string;
  poster?: string;
  title?: string;
  thumbnails?: string;
  textTracks?: TrackProps[];
  className?: string;
  download?: string;
  showMuteButton?: boolean;
};

export function Player({
  src,
  poster,
  title = 'Video',
  thumbnails,
  textTracks = [],
  className = '',
  showMuteButton,
  download,
}: PlayerProps) {
  const player = useRef<MediaPlayerInstance>(null);

  useEffect(() => {
    return player.current?.subscribe(({ paused, viewType }) => {
      // console.log('paused:', paused, 'viewType:', viewType);
    });
  }, []);

  function onProviderChange(
    provider: MediaProviderAdapter | null,
    _event: MediaProviderChangeEvent
  ) {
    if (isHLSProvider(provider)) {
      provider.config = {};
    }
  }

  function onCanPlay(_detail: MediaCanPlayDetail, _event: MediaCanPlayEvent) {
    // Called when the media is ready to play.
  }

  return (
    <MediaPlayer
      ref={player}
      src={src}
      title={title}
      crossorigin="anonymous"
      playsinline
      onProviderChange={onProviderChange}
      onCanPlay={onCanPlay}
      className={`w-full aspect-video bg-slate-900 text-white font-sans overflow-hidden rounded-md ring-media-focus data-[focus]:ring-4 ${className}`}
    >
      <MediaProvider>
        {poster && (
          <Poster
            className="absolute inset-0 block h-full w-full rounded-md opacity-0 transition-opacity data-[visible]:opacity-100 object-cover"
            src={poster}
            alt={`${title} Poster`}
          />
        )}
        {textTracks.map((track: TrackProps) => (
          <Track {...track} key={track.src} />
        ))}
      </MediaProvider>

      <VideoLayout thumbnails={thumbnails} download={download} showMuteButton={showMuteButton} />
    </MediaPlayer>
  );
}
