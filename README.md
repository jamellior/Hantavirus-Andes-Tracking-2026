# Hantavirus Andes Strain - Global Tracking Dashboard (2026)

Interactive dashboard developed in **Power BI Desktop** to monitor the 2026 Hantavirus outbreak (Andes strain). This project integrates geospatial data with official epidemiological reports.

## 📊 Dashboard Preview
![Dashboard Preview](andes dashboard.png)

## 📁 Repository Structure
- **hantaV2.xlsx**: Normalized dataset using OnlyOffice. Source: WHO Disease Outbreak News (DON).
- **hantaVisual.pbix**: Power BI report including the star-schema relational model and dark-mode visualizations.

## 🔬 Technical Specifications
- **Virus Strain:** Andes virus (ANDV).
- **Key Features:** Interhuman transmission tracking, Case Fatality Rate (CFR) analysis, and geospatial heatmaps.
- **Model:** Star Schema (Cases Fact Table <-> Geography Dimension Table).

## 🛠️ How to use
1. Clone this repository.
2. Open the `.pbix` file in Power BI Desktop.
3. If the data source path is broken, go to `Transform Data` > `Data source settings` and point to the local `.xlsx` file.

## ⚖️ Disclaimer
This project is for educational and analytical purposes based on publicly available World Health Organization (WHO) data.
