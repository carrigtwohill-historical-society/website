---
title: "Local Cemetery Burials"
description: "An online searchable database for both St David’s and Templecurraheen Cemeteries."
permalink: /cemeteries/interred/
layout: layouts/page.njk
section: cemeteries
oldPath: "/Cemeteries/Interred.aspx"
---

<h1>Internments at St David&#39;s &amp; Templecurraheen Cemeteries</h1>
<p class="indentedText">
    The database includes known burials at St David’s,  Templecurraheen, and Caherlag. The current database results are only tempory which are still being developed.<br/>
    Select a surname to display matching records.
</p>

<div class="interred-layout">
    <section class="interred-search" data-interred-search aria-labelledby="interred-search-label">
        <label id="interred-search-label" for="interred-surname">Select a surname</label>
        <select id="interred-surname" data-interred-surname>
            <option value="">Choose a surname</option>
        </select>
        <p class="interred-status" data-interred-status role="status">Loading cemetery records...</p>
    </section>

    <div class="interred-results" data-interred-results></div>
</div>
<noscript>
    <p class="search-skeleton">JavaScript is required to search the cemetery records.</p>
</noscript>
<script src="/js/interred.js" defer></script>

