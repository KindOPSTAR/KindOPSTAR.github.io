'use client';

import { useState } from 'react';
import { Expand, Play, Square } from 'lucide-react';
import mediaData from '@/data/publication-media.json';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

type Media = {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  sourceUrl: string;
  sourceLabel: string;
  credit: string;
  animation?: string;
  pdfUrl?: string;
};
const media = mediaData as Record<string, Media>;

export default function PublicationFigure({
  publicationId,
  title,
}: {
  publicationId: string;
  title: string;
}) {
  const item = media[publicationId];
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  if (!item) return null;
  return (
    <figure className="publication-figure">
      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) setPlaying(false);
        }}
      >
        <DialogTrigger
          className="figure-preview"
          aria-label={`Enlarge figure: ${title}`}
        >
          <img
            src={item.src}
            width={item.width}
            height={item.height}
            alt={item.alt}
            loading="lazy"
            decoding="async"
          />
          <span className="figure-expand">
            {item.animation ? <Play size={14} /> : <Expand size={14} />}
            {item.animation ? 'View demo' : 'Enlarge'}
          </span>
        </DialogTrigger>
        <DialogContent className="publication-lightbox">
          <DialogTitle className="figure-title">
            {title.replace('✦', '')}
          </DialogTitle>
          <DialogDescription className="figure-description">
            {item.caption}
          </DialogDescription>
          <div className="figure-stage">
            <img
              src={playing && item.animation ? item.animation : item.src}
              alt={item.alt}
            />
          </div>
          <div className="figure-actions">
            {item.animation && (
              <Button
                className="map-button"
                onClick={() => setPlaying(!playing)}
                aria-pressed={playing}
              >
                {playing ? <Square size={15} /> : <Play size={15} />}
                {playing ? 'Stop animation' : 'Play GIF'}
              </Button>
            )}
            <a href={item.sourceUrl} target="_blank" rel="noreferrer">
              {item.sourceLabel} ↗
            </a>
            {item.pdfUrl && (
              <a href={item.pdfUrl} target="_blank" rel="noreferrer">
                Read PDF ↗
              </a>
            )}
          </div>
          <p className="figure-credit">{item.credit}</p>
        </DialogContent>
      </Dialog>
      <figcaption>
        <a href={item.sourceUrl} target="_blank" rel="noreferrer">
          {item.sourceLabel} ↗
        </a>
      </figcaption>
    </figure>
  );
}
