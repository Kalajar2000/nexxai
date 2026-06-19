/* Tools & Tech Stack — two draggable, auto-scrolling tool rows + the engineering stack card.
   Safe to load anywhere: it no-ops if the section markup isn't present. */
(function(){
    /* tool chips: [name, file, brand color] */
    var ROWA=[
        ['Claude','claude.svg','#d97757'],['GPT','gpt.svg','#10a37f'],['Gemini','gemini.svg','#4285f4'],
        ['Grok','grok.png','#94a3b8'],['Perplexity','perplexity.svg','#20b8cd'],['Mistral','mistral.svg','#fa520f'],
        ['DeepSeek','deepseek.svg','#4d6bfe'],['Ollama','ollama.svg','#cbd5e1'],['Midjourney','midjourney.png','#818cf8'],
        ['Higgsfield','higgsfield.png','#ec4899'],['Runway','runwayml.png','#a78bfa'],['Synthesia','synthesia.png','#6366f1'],
        ['Zapier','zapier.svg','#ff4f00'],['Make','make.svg','#9b5de5']
    ];
    var ROWB=[
        ['n8n','n8n.svg','#ea4b71'],['Power Automate','powerautomate.svg','#0b6bf2'],['GoHighLevel','gohighlevel.png','#38bdf8'],
        ['HubSpot','hubspot.svg','#ff7a59'],['Airtable','airtable.svg','#fcb400'],['Notion','notion.svg','#94a3b8'],
        ['Slack','slack.svg','#36c5f0'],['Microsoft 365','microsoft365.svg','#f25022'],['App Store','appstore.svg','#0d96f6'],
        ['Google Play','googleplay.svg','#00c4ff'],['Postman','postman.svg','#ff6c37'],['GraphQL','graphql.svg','#e10098'],
        ['Swagger','swagger.svg','#85ea2d']
    ];
    var TECH=[
        ['AI & Machine Learning','#a78bfa',[['TensorFlow','tensorflow'],['PyTorch','pytorch'],['LangChain','langchain'],['Hugging Face','huggingface'],['Scikit-learn','scikitlearn'],['OpenCV','opencv'],['Keras','keras'],['Pandas','pandas'],['NumPy','numpy']]],
        ['Backend','#60a5fa',[['.NET Core','dotnet'],['Node.js','nodejs'],['NestJS','nestjs'],['Express','express'],['Django','django'],['FastAPI','fastapi'],['Spring Boot','springboot'],['Ruby on Rails','rubyonrails'],['Laravel','laravel'],['GoLang','go']]],
        ['Frontend','#34d3ee',[['React','react'],['Next.js','nextjs'],['Vue.js','vuejs'],['Angular','angular'],['Tailwind CSS','tailwindcss'],['Bootstrap','bootstrap'],['HTML5','html5'],['CSS3','css3']]],
        ['Mobile','#4ade80',[['Flutter','flutter'],['React Native','reactnative'],['Swift','swift'],['Kotlin','kotlin'],['Xamarin','xamarin'],['Ionic','ionic']]],
        ['Databases','#fbbf24',[['PostgreSQL','postgresql'],['MongoDB','mongodb'],['MySQL','mysql'],['Microsoft SQL','mssql'],['Redis','redis'],['Firebase','firebase'],['Supabase','supabase'],['DynamoDB','dynamodb']]],
        ['Cloud & DevOps','#f472b6',[['AWS','aws'],['Azure','azure'],['Google Cloud','googlecloud'],['Docker','docker'],['Kubernetes','kubernetes'],['Jenkins','jenkins'],['Git','git'],['CI/CD','']]]
    ];

    function chip(t){return '<span class="ts-chip" style="--c:'+t[2]+'"><img src="assets/brand-stack/'+t[1]+'" alt="'+t[0]+'" loading="lazy"><b>'+t[0]+'</b></span>';}
    function fill(id,arr){var el=document.getElementById(id);if(!el)return false;var h=arr.map(chip).join('');el.innerHTML=h+h;return true;}

    var hasRows=fill('tsRowA',ROWA);fill('tsRowB',ROWB);

    var techEl=document.getElementById('tsTech');
    if(techEl){
        techEl.innerHTML=TECH.map(function(g){
            var pills=g[2].map(function(it){var ic=it[1]?'<img src="assets/tech/'+it[1]+'.svg" alt="" loading="lazy">':'<i class="fas fa-infinity"></i>';return '<span class="ts-pill" style="--c:'+g[1]+'">'+ic+'<span>'+it[0]+'</span></span>';}).join('');
            return '<div class="ts-cat" style="--c:'+g[1]+'"><h4 style="color:'+g[1]+'">'+g[0]+'</h4><div class="ts-pills">'+pills+'</div></div>';
        }).join('');
    }

    if(!hasRows)return;

    /* draggable + auto-scrolling marquee */
    function marquee(trackId,dir,speed){
        var track=document.getElementById(trackId);if(!track)return;
        var box=track.parentNode;
        var half=track.scrollWidth/2;
        var pos=dir<0?0:-half;
        var vel=0,dragging=false,lastX=0;
        function norm(p){if(!half)return p;while(p<=-half)p+=half;while(p>0)p-=half;return p;}
        function frame(){
            if(!dragging){pos+=dir*speed+vel;vel*=0.93;if(Math.abs(vel)<0.02)vel=0;}
            pos=norm(pos);
            track.style.transform='translateX('+pos+'px)';
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
        box.addEventListener('pointerdown',function(e){dragging=true;lastX=e.clientX;vel=0;try{box.setPointerCapture(e.pointerId);}catch(_){}});
        box.addEventListener('pointermove',function(e){if(!dragging)return;var dx=e.clientX-lastX;lastX=e.clientX;pos=norm(pos+dx);vel=dx;track.style.transform='translateX('+pos+'px)';});
        function end(){dragging=false;}
        box.addEventListener('pointerup',end);
        box.addEventListener('pointercancel',end);
        window.addEventListener('load',function(){half=track.scrollWidth/2;});
    }
    var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    marquee('tsRowA',-1,reduce?0:0.45);
    marquee('tsRowB', 1,reduce?0:0.45);
})();
