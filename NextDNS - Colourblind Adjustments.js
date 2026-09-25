// ==UserScript==
// @name         NextDNS - Colourblind Adjustments
// @description  Converts NextDNS logs, the Allowlist, and the Denylist to colourblind orange and turquoise for better visibility
// @author       PixelSpark987 - https://is.gd/PS987
// @namespace    http://tampermonkey.net/
// @downloadURL  https://raw.githubusercontent.com/PixelSpark987/NextDNS-Colourblind-Adjustments/refs/heads/main/NextDNS%20-%20Colourblind%20Adjustments.js
// @updateURL    https://raw.githubusercontent.com/PixelSpark987/NextDNS-Colourblind-Adjustments/refs/heads/main/NextDNS%20-%20Colourblind%20Adjustments.js
// @icon         https://my.nextdns.io/favicon.ico
// @version      2.0
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

    function isGrey(rgb) {
        if (!rgb) return true;
        const max = Math.max(rgb.r, rgb.g, rgb.b);
        const min = Math.min(rgb.r, rgb.g, rgb.b);
        return (max - min) <= 15;
    }

    function resetRowStyles(row) {
        row.style.borderLeftColor = '';
        row.style.color = '';
        const icons = row.querySelectorAll('svg, .reason-icon');
        icons.forEach(icon => {
            icon.style.color = '';
        });
    }

    function isRowDisabled(row) {
        // Explicit toggle switch check
        const toggleSwitch = row.querySelector('.form-check-input[type="checkbox"]');
        if (toggleSwitch) {
            return !toggleSwitch.checked;
        }

        // Check overall row/main content opacity for logs or non-switch views
        const flexMain = row.querySelector('.flex-grow-1');
        if (flexMain && flexMain.style.opacity) {
            const opacityVal = parseFloat(flexMain.style.opacity);
            if (opacityVal < 0.8) return true;
        }

        return false;
    }

    function processRow(row) {
        if (isRowDisabled(row)) {
            resetRowStyles(row);
            return;
        }

        const computedStyle = window.getComputedStyle(row);
        const rawBorderColor = computedStyle.borderLeftColor;
        const inlineBorderColor = row.style.borderLeftColor || row.style.borderLeft || row.getAttribute('data-darkreader-inline-border-left');

        const rgb = parseRgbValues(inlineBorderColor) || parseRgbValues(rawBorderColor);

        // Standard NextDNS red border (rgb(255, 65, 54)) or any dominant red tint maps to ORANGE
        // If rgb is missing or is neutral grey, default active items on categories/denylist to ORANGE
        let targetColor = COLOR_BLIND_ORANGE;

        if (rgb && !isGrey(rgb)) {
            if (rgb.g > rgb.r || rgb.b > rgb.r) {
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
            } else if (mutation.type === 'attributes') {
                if (mutation.target.classList && mutation.target.classList.contains('list-group-item')) {
                    processRow(mutation.target);
                } else if (mutation.target.classList && mutation.target.classList.contains('form-check-input')) {
                    const parentRow = mutation.target.closest('.list-group-item');
                    if (parentRow) processRow(parentRow);
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
        attributeFilter: ['style', 'checked']
    });
})();
