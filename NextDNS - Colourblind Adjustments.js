// ==UserScript==
// @name         NextDNS - Colourblind Adjustments
// @description  Converts NextDNS logs, the Allowlist, and the Denylist to colourblind orange and turquoise for better visibility
// @author       PixelSpark987 - https://is.gd/PS987
// @namespace    http://tampermonkey.net/
// @downloadURL  https://raw.githubusercontent.com/PixelSpark987/NextDNS-Colourblind-Adjustments/refs/heads/main/NextDNS%20-%20Colourblind%20Adjustments.js
// @updateURL    https://raw.githubusercontent.com/PixelSpark987/NextDNS-Colourblind-Adjustments/refs/heads/main/NextDNS%20-%20Colourblind%20Adjustments.js
// @version      1.5
// @match        https://my.nextdns.io/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const COLOR_BLIND_ORANGE = 'rgb(230, 159, 0)';  // #E69F00
    const COLOR_BLIND_BLUE = 'rgb(86, 180, 233)';    // #56B4E9

    function parseRgbValues(colorString) {
        if (!colorString) return null;
        const matches = colorString.match(/\d+/g);
        if (matches && matches.length >= 3) {
            return {
                r: parseInt(matches[0], 10),
                g: parseInt(matches[1], 10),
                b: parseInt(matches[2], 10)
            };
        }
        return null;
    }

    function processRow(row) {
        const computedStyle = window.getComputedStyle(row);
        const rawBorderColor = computedStyle.borderLeftColor;

        // Check inline style directly to catch native site resets
        const inlineBorderColor = row.style.borderLeftColor || row.style.borderLeft;

        // If disabled / no border color active, don't force recolour
        if (!rawBorderColor || rawBorderColor === 'transparent' || rawBorderColor === 'rgba(0, 0, 0, 0)') {
            return;
        }

        const rgb = parseRgbValues(rawBorderColor) || parseRgbValues(inlineBorderColor);
        let targetColor = null;

        if (rgb) {
            // Detect Red (Allowlist/Denylist/Logs red)
            if (rgb.r > 180 && rgb.g < 120 && rgb.b < 120) {
                targetColor = COLOR_BLIND_ORANGE;
            }
            // Detect Green (Allowlist/Denylist/Logs green)
            else if (rgb.g > 120 && rgb.r < 120) {
                targetColor = COLOR_BLIND_BLUE;
            }
        }

        if (targetColor) {
            if (row.style.borderLeftColor !== targetColor) {
                row.style.borderLeftColor = targetColor;
            }
            if (row.style.color !== targetColor) {
                row.style.color = targetColor;
            }

            const icons = row.querySelectorAll('svg, .reason-icon');
            icons.forEach(icon => {
                if (icon.style.color !== targetColor) {
                    icon.style.color = targetColor;
                }
            });
        }
    }

    function applyTextRecolour() {
        const rows = document.querySelectorAll('.list-group-item');
        rows.forEach(processRow);
    }

    applyTextRecolour();

    const observer = new MutationObserver(mutations => {
        let shouldCheck = false;
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                shouldCheck = true;
                break;
            } else if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                if (mutation.target.classList && mutation.target.classList.contains('list-group-item')) {
                    processRow(mutation.target);
                }
            }
        }
        if (shouldCheck) {
            applyTextRecolour();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style']
    });
})();
