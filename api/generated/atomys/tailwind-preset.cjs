/* Atomys Design Language 2.1.0 — Tailwind CSS 3 preset. Generováno, needitovat ručně.
 *
 * Přísný preset (výchozí) nahrazuje paletu, písma, zaoblení a stíny Tailwindu, takže
 * třídy jako bg-indigo-500, rounded-xl nebo shadow-lg přestanou existovat. Tailwind 3 neznámé
 * třídy tiše vynechá; najde je node tools/kontrola-stylu.mjs.
 * Přechodný preset (require(...).prechodny) jen přidává barvy pod předponou at-
 * (bg-at-canvas, text-at-ink) a nechává výchozí paletu pro postupnou migraci.
 * Oba vypínají preflight (corePlugins.preflight = false): jeho pravidla nejsou ve vrstvě
 * @layer a přebila by komponenty at-*. Reset prvků dělá atomys.css (vrstva atomys.zaklad).
 * Barvy se řídí zvoleným vzhledem, motivem i oblastí; předpokládají načtené atomys.css.
 */
const spolecne = {
  "corePlugins": {
    "preflight": false
  },
  "darkMode": [
    "variant",
    [
      "[data-theme=\"dark\"] &",
      "@media (prefers-color-scheme: dark) { :root:not([data-theme]) & }"
    ]
  ]
};
const preset = Object.assign({
  "theme": {
    "colors": {
      "transparent": "transparent",
      "current": "currentColor",
      "inherit": "inherit",
      "canvas": "color-mix(in srgb, var(--at-canvas) calc(<alpha-value> * 100%), transparent)",
      "surface": {
        "1": "color-mix(in srgb, var(--at-surface-1) calc(<alpha-value> * 100%), transparent)",
        "2": "color-mix(in srgb, var(--at-surface-2) calc(<alpha-value> * 100%), transparent)"
      },
      "ink": {
        "DEFAULT": "color-mix(in srgb, var(--at-ink) calc(<alpha-value> * 100%), transparent)",
        "soft": "color-mix(in srgb, var(--at-ink-soft) calc(<alpha-value> * 100%), transparent)"
      },
      "muted": "color-mix(in srgb, var(--at-muted) calc(<alpha-value> * 100%), transparent)",
      "rule": {
        "DEFAULT": "color-mix(in srgb, var(--at-rule) calc(<alpha-value> * 100%), transparent)",
        "strong": "color-mix(in srgb, var(--at-rule-strong) calc(<alpha-value> * 100%), transparent)"
      },
      "field": {
        "border": "color-mix(in srgb, var(--at-field-border) calc(<alpha-value> * 100%), transparent)"
      },
      "focus": {
        "DEFAULT": "color-mix(in srgb, var(--at-focus) calc(<alpha-value> * 100%), transparent)",
        "halo": "color-mix(in srgb, var(--at-focus-halo) calc(<alpha-value> * 100%), transparent)"
      },
      "success": {
        "DEFAULT": "color-mix(in srgb, var(--at-success) calc(<alpha-value> * 100%), transparent)",
        "soft": "color-mix(in srgb, var(--at-success-soft) calc(<alpha-value> * 100%), transparent)"
      },
      "warning": {
        "DEFAULT": "color-mix(in srgb, var(--at-warning) calc(<alpha-value> * 100%), transparent)",
        "soft": "color-mix(in srgb, var(--at-warning-soft) calc(<alpha-value> * 100%), transparent)"
      },
      "danger": {
        "DEFAULT": "color-mix(in srgb, var(--at-danger) calc(<alpha-value> * 100%), transparent)",
        "soft": "color-mix(in srgb, var(--at-danger-soft) calc(<alpha-value> * 100%), transparent)"
      },
      "info": {
        "DEFAULT": "color-mix(in srgb, var(--at-info) calc(<alpha-value> * 100%), transparent)",
        "soft": "color-mix(in srgb, var(--at-info-soft) calc(<alpha-value> * 100%), transparent)"
      },
      "bar": {
        "DEFAULT": "color-mix(in srgb, var(--at-bar) calc(<alpha-value> * 100%), transparent)",
        "muted": "color-mix(in srgb, var(--at-bar-muted) calc(<alpha-value> * 100%), transparent)",
        "rule": "color-mix(in srgb, var(--at-bar-rule) calc(<alpha-value> * 100%), transparent)",
        "field": "color-mix(in srgb, var(--at-bar-field) calc(<alpha-value> * 100%), transparent)",
        "field-border": "color-mix(in srgb, var(--at-bar-field-border) calc(<alpha-value> * 100%), transparent)"
      },
      "on": {
        "bar": "color-mix(in srgb, var(--at-on-bar) calc(<alpha-value> * 100%), transparent)",
        "table-head": "color-mix(in srgb, var(--at-on-table-head) calc(<alpha-value> * 100%), transparent)",
        "accent": "color-mix(in srgb, var(--at-on-accent) calc(<alpha-value> * 100%), transparent)",
        "bar-accent": "color-mix(in srgb, var(--at-on-bar-accent) calc(<alpha-value> * 100%), transparent)"
      },
      "table": {
        "head": "color-mix(in srgb, var(--at-table-head) calc(<alpha-value> * 100%), transparent)"
      },
      "overlay": "color-mix(in srgb, var(--at-overlay) calc(<alpha-value> * 100%), transparent)",
      "accent": {
        "DEFAULT": "color-mix(in srgb, var(--at-accent) calc(<alpha-value> * 100%), transparent)",
        "hover": "color-mix(in srgb, var(--at-accent-hover) calc(<alpha-value> * 100%), transparent)",
        "border": "color-mix(in srgb, var(--at-accent-border) calc(<alpha-value> * 100%), transparent)",
        "text": "color-mix(in srgb, var(--at-accent-text) calc(<alpha-value> * 100%), transparent)",
        "soft": "color-mix(in srgb, var(--at-accent-soft) calc(<alpha-value> * 100%), transparent)"
      }
    },
    "fontFamily": {
      "sans": "var(--at-font-ui)",
      "mono": "var(--at-font-data)",
      "ui": "var(--at-font-ui)",
      "data": "var(--at-font-data)"
    },
    "fontSize": {
      "micro": "var(--at-font-size-micro)",
      "h4": "var(--at-font-size-h4)",
      "h3": "var(--at-font-size-h3)",
      "h2": "var(--at-font-size-h2)",
      "h1": "var(--at-font-size-h1)",
      "display": "var(--at-font-size-display)",
      "text": "var(--at-font-size-text)",
      "small": "var(--at-font-size-small)",
      "table": "var(--at-font-size-table)"
    },
    "borderRadius": {
      "none": "0",
      "DEFAULT": "var(--at-radius-control)",
      "sm": "var(--at-radius-control)",
      "md": "var(--at-radius-control)",
      "lg": "var(--at-radius-dialog)",
      "control": "var(--at-radius-control)",
      "surface": "var(--at-radius-surface)",
      "dialog": "var(--at-radius-dialog)",
      "full": "var(--at-radius-pill)"
    },
    "boxShadow": {
      "none": "none",
      "DEFAULT": "none",
      "layer": "var(--at-shadow-layer)"
    },
    "extend": {
      "spacing": {
        "control": "var(--at-control-height)",
        "row": "var(--at-row-height)",
        "touch": "var(--at-touch-target)"
      },
      "transitionDuration": {
        "fast": "var(--at-motion-fast)",
        "base": "var(--at-motion-base)",
        "slow": "var(--at-motion-slow)",
        "spin": "var(--at-motion-spin)"
      },
      "transitionTimingFunction": {
        "atomys": "var(--at-motion-ease)"
      },
      "maxWidth": {
        "text": "var(--at-layout-text-max)",
        "page": "var(--at-layout-page-max)"
      }
    }
  }
}, spolecne);
// Holé třídy border a ring kreslí linkou a barvou fokusu Atomys, ne currentColor a modrou.
// Výchozí barvu kroužku Tailwind skládá funkcí s průhledností; řetězec s var() by nahradil modrou.
preset.theme.borderColor = ({ theme }) => ({ ...theme('colors'), DEFAULT: "color-mix(in srgb, var(--at-rule) calc(<alpha-value> * 100%), transparent)" });
preset.theme.ringColor = ({ theme }) => ({
  ...theme('colors'),
  DEFAULT: ({ opacityValue }) => `color-mix(in srgb, var(--at-focus) calc(${opacityValue ?? 1} * 100%), transparent)`,
});
preset.theme.extend.ringOpacity = { DEFAULT: '1' };
preset.prechodny = Object.assign({
  "theme": {
    "extend": {
      "colors": {
        "at": {
          "transparent": "transparent",
          "current": "currentColor",
          "inherit": "inherit",
          "canvas": "color-mix(in srgb, var(--at-canvas) calc(<alpha-value> * 100%), transparent)",
          "surface": {
            "1": "color-mix(in srgb, var(--at-surface-1) calc(<alpha-value> * 100%), transparent)",
            "2": "color-mix(in srgb, var(--at-surface-2) calc(<alpha-value> * 100%), transparent)"
          },
          "ink": {
            "DEFAULT": "color-mix(in srgb, var(--at-ink) calc(<alpha-value> * 100%), transparent)",
            "soft": "color-mix(in srgb, var(--at-ink-soft) calc(<alpha-value> * 100%), transparent)"
          },
          "muted": "color-mix(in srgb, var(--at-muted) calc(<alpha-value> * 100%), transparent)",
          "rule": {
            "DEFAULT": "color-mix(in srgb, var(--at-rule) calc(<alpha-value> * 100%), transparent)",
            "strong": "color-mix(in srgb, var(--at-rule-strong) calc(<alpha-value> * 100%), transparent)"
          },
          "field": {
            "border": "color-mix(in srgb, var(--at-field-border) calc(<alpha-value> * 100%), transparent)"
          },
          "focus": {
            "DEFAULT": "color-mix(in srgb, var(--at-focus) calc(<alpha-value> * 100%), transparent)",
            "halo": "color-mix(in srgb, var(--at-focus-halo) calc(<alpha-value> * 100%), transparent)"
          },
          "success": {
            "DEFAULT": "color-mix(in srgb, var(--at-success) calc(<alpha-value> * 100%), transparent)",
            "soft": "color-mix(in srgb, var(--at-success-soft) calc(<alpha-value> * 100%), transparent)"
          },
          "warning": {
            "DEFAULT": "color-mix(in srgb, var(--at-warning) calc(<alpha-value> * 100%), transparent)",
            "soft": "color-mix(in srgb, var(--at-warning-soft) calc(<alpha-value> * 100%), transparent)"
          },
          "danger": {
            "DEFAULT": "color-mix(in srgb, var(--at-danger) calc(<alpha-value> * 100%), transparent)",
            "soft": "color-mix(in srgb, var(--at-danger-soft) calc(<alpha-value> * 100%), transparent)"
          },
          "info": {
            "DEFAULT": "color-mix(in srgb, var(--at-info) calc(<alpha-value> * 100%), transparent)",
            "soft": "color-mix(in srgb, var(--at-info-soft) calc(<alpha-value> * 100%), transparent)"
          },
          "bar": {
            "DEFAULT": "color-mix(in srgb, var(--at-bar) calc(<alpha-value> * 100%), transparent)",
            "muted": "color-mix(in srgb, var(--at-bar-muted) calc(<alpha-value> * 100%), transparent)",
            "rule": "color-mix(in srgb, var(--at-bar-rule) calc(<alpha-value> * 100%), transparent)",
            "field": "color-mix(in srgb, var(--at-bar-field) calc(<alpha-value> * 100%), transparent)",
            "field-border": "color-mix(in srgb, var(--at-bar-field-border) calc(<alpha-value> * 100%), transparent)"
          },
          "on": {
            "bar": "color-mix(in srgb, var(--at-on-bar) calc(<alpha-value> * 100%), transparent)",
            "table-head": "color-mix(in srgb, var(--at-on-table-head) calc(<alpha-value> * 100%), transparent)",
            "accent": "color-mix(in srgb, var(--at-on-accent) calc(<alpha-value> * 100%), transparent)",
            "bar-accent": "color-mix(in srgb, var(--at-on-bar-accent) calc(<alpha-value> * 100%), transparent)"
          },
          "table": {
            "head": "color-mix(in srgb, var(--at-table-head) calc(<alpha-value> * 100%), transparent)"
          },
          "overlay": "color-mix(in srgb, var(--at-overlay) calc(<alpha-value> * 100%), transparent)",
          "accent": {
            "DEFAULT": "color-mix(in srgb, var(--at-accent) calc(<alpha-value> * 100%), transparent)",
            "hover": "color-mix(in srgb, var(--at-accent-hover) calc(<alpha-value> * 100%), transparent)",
            "border": "color-mix(in srgb, var(--at-accent-border) calc(<alpha-value> * 100%), transparent)",
            "text": "color-mix(in srgb, var(--at-accent-text) calc(<alpha-value> * 100%), transparent)",
            "soft": "color-mix(in srgb, var(--at-accent-soft) calc(<alpha-value> * 100%), transparent)"
          }
        }
      },
      "fontFamily": {
        "ui": "var(--at-font-ui)",
        "data": "var(--at-font-data)"
      },
      "borderRadius": {
        "control": "var(--at-radius-control)",
        "dialog": "var(--at-radius-dialog)",
        "surface": "var(--at-radius-surface)"
      }
    }
  }
}, spolecne);
module.exports = preset;
