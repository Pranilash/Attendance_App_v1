# Academic Presentations & Project Documentation

This directory contains presentation decks, project reports, and Python generation scripts for the Smart Attendance System capstone reviews.

## Contents

| File | Description |
| :--- | :--- |
| `Secure_Automated_Attendance_System_VII_Sem.pptx` | Comprehensive slide deck for the VII Semester Capstone evaluation committee |
| `Smart_Attendance_System_VII_Sem_Review.pptx` | Milestone presentation review slides |
| `Smart_Attendance_Mini_Project_VI_Sem.pdf` | VI Semester Mini Project foundation report |
| `generate_polished_deck.py` | Python script (`python-pptx`) to generate the dark-theme cybernetic presentation deck |
| `generate_presentation.py` | Python script (`python-pptx`) to generate milestone review slides |

## Re-generating Presentations

To rebuild the presentation decks, ensure `python-pptx` is installed:

```bash
pip install python-pptx
python docs/presentations/generate_polished_deck.py
python docs/presentations/generate_presentation.py
```

