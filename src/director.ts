import type { Application, Ticker } from "pixi.js";
import type { BorderedScene } from "./components/BorderedScene";

export const SCENES = ["inside", "outside", "ending"] as const;
export type SceneName = (typeof SCENES)[number];

export type SceneContext = {
  go(name: SceneName): void;
  /** Every scene rebuilt, from the start */
  restart(): void;
  showPointer(show: boolean): void;
};

/** Shows one scene at a time, feeding it frames and resizes */
export class Director {
  private readonly app: Application;
  private scenes: Record<SceneName, BorderedScene>;
  private readonly factories: Record<SceneName, (context: SceneContext) => BorderedScene>;
  private readonly initial: SceneName;
  private readonly showPointer: (show: boolean) => void;
  private name: SceneName;

  constructor(
    app: Application,
    factories: Record<SceneName, (context: SceneContext) => BorderedScene>,
    options: { initial: SceneName; showPointer: (show: boolean) => void },
  ) {
    this.app = app;
    this.showPointer = options.showPointer;
    this.factories = factories;
    this.initial = options.initial;
    this.scenes = this.build();
    this.name = options.initial;

    app.renderer.on("resize", () => this.fit());
    // Runs before Pixi renders each frame, so input shows up in the very next frame
    app.ticker.add(({ deltaTime, deltaMS }: Ticker) => {
      this.scene.advance({ deltaTime, deltaMS });
    });
    this.show();
  }

  /** For carrying the story across a hot reload */
  saveStory() {
    const scenes = Object.fromEntries(SCENES.map((name) => [name, this.scenes[name].saveStory()]));
    return { current: this.name, scenes };
  }

  restoreStory(state: ReturnType<Director["saveStory"]>) {
    for (const name of SCENES) {
      const saved = state.scenes[name];
      if (saved !== undefined) this.scenes[name].restoreStory(saved);
    }
    this.go(state.current);
  }

  restart() {
    this.scene.leave();
    for (const scene of Object.values(this.scenes)) scene.destroy({ children: true });
    this.scenes = this.build();
    this.name = this.initial;
    this.show();
    this.scene.wake();
  }

  private build() {
    const context: SceneContext = {
      go: (name) => this.go(name),
      restart: () => this.restart(),
      showPointer: this.showPointer,
    };
    return Object.fromEntries(SCENES.map((name) => [name, this.factories[name](context)])) as Record<
      SceneName,
      BorderedScene
    >;
  }

  /** So the current scene can stop its sounds */
  stop() {
    this.scene.leave();
  }

  go(name: SceneName) {
    if (name === this.name) return;
    this.scene.leave();
    this.name = name;
    this.show();
  }

  private get scene() {
    return this.scenes[this.name];
  }

  private show() {
    this.app.stage.removeChildren();
    this.app.stage.addChild(this.scene);
    this.showPointer(true);
    this.scene.enter();
    this.fit();
  }

  private fit() {
    this.scene.fit(this.app.screen.width, this.app.screen.height);
  }
}
