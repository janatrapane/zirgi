# zirgi

Ciltskoki divām ķēvēm, būvēti no [lwhorse.lv](https://lwhorse.lv) - Latvijas šķirnes zirgu publiskās datubāzes.

Lapa: https://janatrapane.github.io/zirgi

- `index.html` - sākums
- `chloe.html` - Chloé Classic Spin ZBZ (2026): ciltsraksti + abu ciltsmāšu pēcnācēju koks
- `lera.html` - Lēra (gaida reģistrēto vārdu vai pases numuru)
- `data/*.json` - dati, kas dzen lapas
- `assets/` - stils un koka skripts

Ģenerē ar `tools/reports/build_zirgi_site.py` repozitorijā `my-ai`; dati izgūti ar `tools/reports/lwhorse_crawl.py`.
