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
        The database has been designed to include known burials at St David’s cemetery and those
        of Templecurraheen. Simply select surname from dropdown list, and use underlined headings 
        to sort.
    </p>
      
    
        
    " SelectCommand="SELECT DISTINCT [PlotSurname] FROM [Internments]">
    
    <figure class="FigureCenter">

        
            <AlternatingRowStyle BackColor="White" ForeColor="#284775" />
            <Columns>
                
                
                
                
                
                
                
                
                
                
                
                
                
            </Columns>
            <EditRowStyle BackColor="#999999" />
            <FooterStyle BackColor="#5D7B9D" Font-Bold="True" ForeColor="White" />
            <HeaderStyle BackColor="#5D7B9D" Font-Bold="True" ForeColor="White" />
            <PagerStyle BackColor="#284775" ForeColor="White" HorizontalAlign="Center" />
            <RowStyle BackColor="#F7F6F3" ForeColor="#333333" />
            <SelectedRowStyle BackColor="#E2DED6" Font-Bold="True" ForeColor="#333333" />
            <SortedAscendingCellStyle BackColor="#E9E7E2" />
            <SortedAscendingHeaderStyle BackColor="#506C8C" />
            <SortedDescendingCellStyle BackColor="#FFFDF8" />
            <SortedDescendingHeaderStyle BackColor="#6F8DAE" />
        
        <br />
        "
            SelectCommand="SELECT * FROM [Internments] WHERE ([PlotSurname] = @PlotSurname)">
            <SelectParameters>
                
            </SelectParameters>

        
    </figure>
<section class="search-skeleton" aria-label="Search coming soon">
<p><strong>Searchable records:</strong> this page will include a search of the society’s research collection. Data will be added when the hosting database export is available.</p>
</section>

