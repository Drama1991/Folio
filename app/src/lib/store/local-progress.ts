"use client";

import { useEffect, useState } from "react";

interface State {
  episodes: Record<string, boolean>;
  total: number;
  lastUpdate: string;
}

function load(uuid: string): State {
  if (typeof window === "undefined") return { episodes: {}, total: 0, lastUpdate: "" };
  try {
    const raw = localStorage.getItem(`folio:ep:${uuid}`);
    if (raw) return JSON.parse(raw) as State;
  } catch {}
  return { episodes: {}, total: 0, lastUpdate: "" };
}

function save(uuid: string, s: State): void {
  try { localStorage.setItem(`folio:ep:${uuid}`, JSON.stringify(s)); } catch {}
}

export function useEpisodeProgress(uuid: string, defaultTotal: number) {
  const [state, setState] = useState<State>({ episodes: {}, total: defaultTotal, lastUpdate: "" });

  useEffect(() => {
    const cur = load(uuid);
    setState({ ...cur, total: cur.total || defaultTotal });
  }, [uuid, defaultTotal]);

  function toggle(ep: number) {
    setState((s) => {
      const eps = { ...s.episodes };
      eps[String(ep)] = !eps[String(ep)];
      const next = { ...s, episodes: eps, lastUpdate: new Date().toISOString() };
      save(uuid, next);
      return next;
    });
  }

  function setTotal(t: number) {
    setState((s) => {
      const next = { ...s, total: t, lastUpdate: new Date().toISOString() };
      save(uuid, next);
      return next;
    });
  }

  const watched = Object.values(state.episodes).filter(Boolean).length;
  return { ...state, watched, toggle, setTotal };
}

interface ReadingState {
  current: number;
  total: number;
  lastRead: string;
}

function loadRead(uuid: string): ReadingState {
  if (typeof window === "undefined") return { current: 0, total: 0, lastRead: "" };
  try {
    const raw = localStorage.getItem(`folio:read:${uuid}`);
    if (raw) return JSON.parse(raw) as ReadingState;
  } catch {}
  return { current: 0, total: 0, lastRead: "" };
}

function saveRead(uuid: string, s: ReadingState): void {
  try { localStorage.setItem(`folio:read:${uuid}`, JSON.stringify(s)); } catch {}
}

export function useReadingProgress(uuid: string, defaultTotal: number) {
  const [state, setState] = useState<ReadingState>({ current: 0, total: defaultTotal, lastRead: "" });

  useEffect(() => {
    const cur = loadRead(uuid);
    setState({ ...cur, total: cur.total || defaultTotal });
  }, [uuid, defaultTotal]);

  function update(current: number, total?: number) {
    setState((s) => {
      const next = { ...s, current, total: total ?? s.total, lastRead: new Date().toISOString() };
      saveRead(uuid, next);
      return next;
    });
  }

  return { ...state, update };
}
