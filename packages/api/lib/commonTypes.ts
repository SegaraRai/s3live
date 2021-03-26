export interface Live {
  readonly id: string;
  readonly userId: string;
  readonly createdAt: number;
  readonly startedAt: number | null;
  readonly finishedAt: number | null;
  readonly title: string;
}

export interface Comment {
  readonly id: string;
  readonly userId: string;
  readonly timestamp: number;
  readonly content: string;
}

export interface ViewerCount {
  readonly viewerCount: number;
}
