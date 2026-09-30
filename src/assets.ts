import { AssetsManifest } from "pixi.js";

export const assetsManifest: AssetsManifest = {
  bundles: [
    {
      name: "title",
      assets: [
        {
          alias: "background_title",
          src: "/assets/title/background_title.png",
        },
      ],
    },
    {
      name: "ui_main",
      assets: [
        {
          alias: "background_ui",
          src: "/assets/UI/background_ui.png",
        },
      ],
    },
    {
      name: "main_static",
      assets: [
        // {
        //   alias: "background_main",
        //   src: "/assets/main/background_main.png",
        // },
        {
          alias: "goal",
          src: "/assets/main/goal.png",
        },
      ],
    },
    {
      name: "main_block",
      assets: [
        {
          alias: "block_red",
          src: "/assets/main/block/block_red.png",
        },
        {
          alias: "block_green",
          src: "/assets/main/block/block_green.png",
        },
        {
          alias: "block_blue",
          src: "/assets/main/block/block_blue.png",
        },
        {
          alias: "block_yellow",
          src: "/assets/main/block/block_yellow.png",
        },
        {
          alias: "block_purple",
          src: "/assets/main/block/block_purple.png",
        },
        {
          alias: "block_unbreakable",
          src: "/assets/main/block/block_unbreakable.png",
        },
      ],
    },
    {
      name: "character",
      assets: [
        // // create
        // {
        //   alias: "character_create_01",
        //   src: "/assets/main/character/create/create_01.png",
        // },
        // {
        //   alias: "character_create_02",
        //   src: "/assets/main/character/create/create_02.png",
        // },
        // {
        //   alias: "character_create_03",
        //   src: "/assets/main/character/create/create_03.png",
        // },
        // {
        //   alias: "character_create_04",
        //   src: "/assets/main/character/create/create_04.png",
        // },
        // {
        //   alias: "character_create_05",
        //   src: "/assets/main/character/create/create_05.png",
        // },
        // damage
        {
          alias: "character_damage_01",
          src: "/assets/main/character/damage/damage_01.png",
        },
        // // grab
        // {
        //   alias: "character_grab_01",
        //   src: "/assets/main/character/grab/grab_01.png",
        // },
        // idle
        {
          alias: "character_idle_01",
          src: "/assets/main/character/idle/idle_01.png",
        },
        // // pull
        // {
        //   alias: "character_pull_01",
        //   src: "/assets/main/character/pull/pull_01.png",
        // },
        // // push
        // {
        //   alias: "character_push_01",
        //   src: "/assets/main/character/push/push_01.png",
        // },
        // // up
        // {
        //   alias: "character_up_01",
        //   src: "/assets/main/character/up/up_01.png",
        // },
        // {
        //   alias: "character_up_02",
        //   src: "/assets/main/character/up/up_02.png",
        // },
        // {
        //   alias: "character_up_03",
        //   src: "/assets/main/character/up/up_03.png",
        // },
        // {
        //   alias: "character_up_04",
        //   src: "/assets/main/character/up/up_04.png",
        // },
        // {
        //   alias: "character_up_05",
        //   src: "/assets/main/character/up/up_05.png",
        // },
        // // use
        // {
        //   alias: "character_use_01",
        //   src: "/assets/main/character/use/use_01.png",
        // },
        // // walk
        // {
        //   alias: "character_walk_01",
        //   src: "/assets/main/character/walk/walk_01.png",
        // },
        // {
        //   alias: "character_walk_02",
        //   src: "/assets/main/character/walk/walk_02.png",
        // },
        // {
        //   alias: "character_walk_03",
        //   src: "/assets/main/character/walk/walk_03.png",
        // },
        // {
        //   alias: "character_walk_04",
        //   src: "/assets/main/character/walk/walk_04.png",
        // },
      ],
    },
    {
      name: "main_star",
      assets: [
        {
          alias: "star_red",
          src: "/assets/main/star/star_red.png",
        },
        {
          alias: "star_green",
          src: "/assets/main/star/star_green.png",
        },
        {
          alias: "star_blue",
          src: "/assets/main/star/star_blue.png",
        },
        {
          alias: "star_yellow",
          src: "/assets/main/star/star_yellow.png",
        },
        {
          alias: "star_purple",
          src: "/assets/main/star/star_purple.png",
        },
      ],
    },
  ],
};
