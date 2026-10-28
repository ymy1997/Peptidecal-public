# Peptide Calculator

Peptide Calculator is a browser-based tool for converting the numbers on a vial label into concentration, volume, and U-100 syringe-unit math.

Try it online: [peptidecal.net](https://peptidecal.net)

## Live tools

- [Peptide Calculator](https://peptidecal.net/)
- [Peptide Reconstitution Calculator](https://peptidecal.net/calculators/peptide-reconstitution-calculator/)
- [Peptide Dosage Calculator](https://peptidecal.net/calculators/peptide-dosage-calculator/)
- [Peptide guides](https://peptidecal.net/guides/)

## What it does

- Calculates concentration, liquid volume, and U-100 syringe units from values you enter.
- Includes separate paths for vials that are already reconstituted and editable math scenarios for vials that are not yet reconstituted.
- Keeps the calculation separate from personal medical, dosing, preparation, or storage decisions.

## Run locally

This is a static site. Serve this folder with any local static web server, then open it in your browser.

For example, with Node.js installed:

```bash
npx serve .
```

## Project boundary

This project provides math based on the numbers a visitor enters. It is not medical advice and does not choose a dose, water amount, treatment, storage method, or injection approach.

## Public-source note

This repository is a public source copy. It intentionally excludes Git history, local Cloudflare files, and deployment credentials.
