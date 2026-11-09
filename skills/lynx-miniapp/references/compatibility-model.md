# Compatibility Model

Treat Douyin miniapp capabilities as supported by Lynx miniapp unless a bundled diff explicitly marks them unsupported, changed, limited, or requiring Lynx-specific config. The bundled references are Lynx-vs-Douyin-miniapp diff lists, not complete support matrices. "Douyin miniapp behavior" and "webview miniapp" mean the WebView-rendered Douyin miniapp (`renderType` omitted or `"webview"`), not an ordinary H5/browser project.

Report only Lynx miniapp differences from Douyin miniapp behavior. If a component, attribute, API, lifecycle, config field, or TTSS/CSS declaration is not listed in the relevant diff, preserve it as Douyin miniapp behavior instead of marking it unsupported or unknown. For CSS long-tail properties, `css_diff.md` and its `css_support/` evidence layer define how absence is resolved (preserve with a low-confidence note for uncommon properties).

All diff references share one status vocabulary:

| Marker | Meaning | Generation rule |
| --- | --- | --- |
| ✅ supported | Works as in Douyin miniapp | Generate freely |
| 🔁 diff | Supported but behavior, defaults, or boundaries differ | Generate only per the listed difference rule |
| ⚠️ partial | Only some values, platforms, or scenarios work | Generate only when the condition is explicit; otherwise use the alternative |
| 🚫 unsupported | Unavailable, or parses without effect | Never generate; use the listed alternative or report blocked |

🚫 failures are usually silent: unsupported TTSS is stripped at template encode (devtool warning only) and unsupported selectors parse but never match. Do not treat "it compiles" as support evidence.

## User-facing language

Unless the user requests another language, use Simplified Chinese for user-visible explanations and reports. Preserve code, paths, identifiers, and stable machine enums.
