---
title: "Local Cemetery Burials"
description: "An online searchable database for both St David’s and Templecurraheen Cemeteries."
permalink: /cemeteries/interred/
layout: layouts/page.njk
section: cemeteries
oldPath: "/Cemeteries/Interred.aspx"
---

<h1>Local Cemetery Internments</h1>
<p class="indentedText">
   The database includes known burials at St David’s, Templecurraheen, and Caherlag cemeteries. The current database results are only temporary which are still being developed. Selector dropdown list will only include names known to be buried in the relevant cemeteries.
   </p>
<p class="indentedText">
     Select a surname to view matching records. The first surname shown is the default as an example.Where a name appears in brackets it refers to an alias such as in Ellen (Geany) Leahy, and would often refer to maiden name.
</p>
<section class="interred-search" data-interred-search aria-labelledby="interred-search-label">
    <div class="interred-filter-grid">
        <div>
            <label id="interred-search-label" for="interred-surname">Surname</label>
            <select id="interred-surname" data-interred-surname>
                <option value="">Choose surname</option>
            </select>
        </div>
        <div>
            <label id="interred-cemetery-label" for="interred-cemetery">Cemetery</label>
            <select id="interred-cemetery" data-interred-cemetery disabled>
                <option value="">Choose surname first</option>
            </select>
        </div>
    </div>
    <p class="interred-status" data-interred-status role="status">Loading cemetery records...</p>
</section>

<div class="interred-results" data-interred-results></div>
<noscript>
    <p class="search-skeleton">JavaScript is required to search the cemetery records.</p>
</noscript>
<script src="/js/interred.js" defer></script>

