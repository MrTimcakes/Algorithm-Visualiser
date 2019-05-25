class algorithmVisualiser{
  configVariables(){ // Bodge for ES6 not supporting Public Field Declarations
    self.dataSet = {
      data: [],
      compIndicator: [],
      compCount: 0,
      swapIndicator: [],
      swapCount: 0,
      iterationCount: 0,
      nextIteration: null,
      iteration: () => { self.dataSet.iterationCount++; self.dataSet.swapIndicator = []; self.dataSet.compIndicator = []; },
      swap: (x,y) => {
        [ self.dataSet.data[x], self.dataSet.data[y] ] = [ self.dataSet.data[y], self.dataSet.data[x] ];
        self.dataSet.swapIndicator = [x, y];
        self.dataSet.swapCount++;
        self.audio.swap();
      },
      lessthan:    (x,y) => { self.audio.comp(); self.dataSet.compIndicator = [x, y]; self.dataSet.compCount++; return self.dataSet.data[x] < self.dataSet.data[y]},
      greaterthan: (x,y) => { self.audio.comp(); self.dataSet.compIndicator = [x, y]; self.dataSet.compCount++; return self.dataSet.data[x] > self.dataSet.data[y]},
    };
    self.options = {
      renderer: "Graphical",
      status: "finished",
      size: 128,
      delay: 16,
      structure: "Random",
      algorithm: "Bubble Sort",
      gui: false,
      fps: false,
      lineColor: "#0000FF",
      compColor: "#FF0000",
      swapColor: "#00FF00",
      lineWidth: 2.5,
      fontSize: 15,
      displayValues: false,
    };
    self.audio = {
      enabled: false,
      volume: 100,
      swapTone: 350,
      compTone: 200,
      synth: new Tone.Synth().toMaster(),
      swap: () =>{if(!self.audio.enabled){return;}self.audio.synth.triggerAttackRelease(self.audio.swapTone, 0.1)},
      comp: () =>{if(!self.audio.enabled){return;}self.audio.synth.triggerAttackRelease(self.audio.compTone, 0.1)},
    };
  }
  constructor(canvas, opts = {}) {
    self = this;
    self.configVariables();
    self.configDynamicFunctions();
    self.options = {...self.options, ...opts}; // Apply construction options    
    self.ctx = canvas.getContext('2d');
    
    if(self.options.gui){
      var gui = new dat.GUI();
      gui.add(self.options, 'renderer', self.renderers.map(x => x.name)).name("Renderer");
      gui.add(self.options, 'algorithm', self.algorithms.map(x => x.name)).name("Algorithm").onFinishChange(self.reset);
      gui.add(self.options, 'structure', self.structures.map(x => x.name)).name("Structure").onFinishChange(self.reset);
      gui.add(self.options, 'size', 32, 256, 8).name("Size").onChange(self.reset);
      gui.add(self.options, 'delay', 0, 64).name("Delay (ms)");
      gui.add(self, 'reset').name("Reset");
      gui.add(self, 'startStop').name("Start / Stop");
      gui.add(self, 'step').name("Step");
      
      let advFolder = gui.addFolder("Advanced");
      let audioFolder = advFolder.addFolder("Audio");
      audioFolder.add(self.audio, 'enabled').name("Enable");
      // audioFolder.add(self.audio, 'volume').name("Volume").onChange(()=>{Tone.Master.volume = self.audio.volume});
      audioFolder.add(self.audio, 'swapTone', 20, 1024).name("Swap Tone");
      audioFolder.add(self.audio, 'compTone', 20, 1024).name("Comp Tone");
      advFolder.addColor(self.options, 'lineColor');
      advFolder.addColor(self.options, 'compColor');
      advFolder.addColor(self.options, 'swapColor');
      advFolder.add(self.options, 'lineWidth', 0, 15);
      advFolder.add(self.options, 'fontSize', 0, 72);
      advFolder.add(self.options, 'displayValues');
      
      if(self.options.fps != false && self.options.gui){
        self.options.fps = new Stats();
        self.options.fps.domElement.height = '48px';
        [].forEach.call(self.options.fps.domElement.children, (child) => (child.style.display = ''));
        
        var perfFolder = gui.addFolder("Performance");
        var perfLi = document.createElement("li");
        self.options.fps.domElement.style.position = "static";
        perfLi.appendChild(self.options.fps.domElement);
        perfLi.classList.add("gui-stats");
        perfFolder.__ul.appendChild(perfLi);
      }
      
    }
    
    if(self.options.fps != false && !(self.options.gui)){
      self.options.fps = new Stats();
      self.options.fps.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
      self.options.fps.domElement.style = "position:fixed;top:0;left:0;";
      document.body.appendChild( self.options.fps.domElement );
    }
    
    self.reset();
    self.draw();
  }

  startStop(){
    switch(self.options.status){
      case "reset":
        self.options.status = "running";
        self.algorithms.find(x => x.name === self.options.algorithm).algorithm();
        break;
      case "running":
        self.options.status = "paused";
        break;
      case "paused":
        self.options.status = "running";
        self.dataSet.nextIteration();
        break;
      default:
        //
    }
  }
  
  step(){
    if(self.options.status == "paused"){self.dataSet.nextIteration()};
  }
  
  resetCounters(){
    self.dataSet.iterationCount = 0;
    self.dataSet.swapIndicator = [];
    self.dataSet.compIndicator = [];
    self.dataSet.swapCount = 0;
    self.dataSet.compCount = 0;
  }

  reset(){
    self.structures.find(x => x.name === self.options.structure).func();
    self.resetCounters();
    self.options.status = "reset";
  }

  draw(){
    if(self.options.fps != false){self.options.fps.begin();}
    let ctx = self.ctx;
    let width = ctx.canvas.width = ctx.canvas.clientWidth;
    let height = ctx.canvas.height = ctx.canvas.clientHeight;
    
    self.renderers.find(x => x.name === self.options.renderer).func();
      
    ctx.font = self.options.fontSize + 'px Arial';
    let textStr = `${self.options.algorithm} Iteration: ${self.dataSet.iterationCount}, Comparisons: ${self.dataSet.compCount}, Swaps: ${self.dataSet.swapCount}`;
    ctx.fillText(textStr, 10, self.options.fontSize + 10);

    ctx.fillStyle = self.options.swapColor;
    let swapColorStr = `Swap Operation Color`;
    ctx.fillText(swapColorStr, 10, self.options.fontSize *2 + 10);
    ctx.fillStyle = self.options.compColor;
    let compColorStr = `Comparison Operation Color`;
    ctx.fillText(compColorStr, 10, self.options.fontSize *3 + 10);

    
    if(self.options.fps != false){self.options.fps.end();}
    window.requestAnimationFrame( () => self.draw() );
  }
  
  async wait(time) {
    return new Promise(function(resolve) {
      self.dataSet.nextIteration = resolve;
      if(self.options.status == "reset"){self.resetCounters();}
      if(self.options.status == "running"){setTimeout(resolve, time);}
    });
  }
  
  configDynamicFunctions(){ // Bodge for ES6 not supporting Public Field Declarations
    self.renderers = [
      {name:"Graphical", func: ()=>{
        let ctx = self.ctx;
        let width = ctx.canvas.width = ctx.canvas.clientWidth;
        let height = ctx.canvas.height = ctx.canvas.clientHeight;
        let lineWidth = self.options.lineWidth || (width/self.dataSet.data.length)+0.5;
        let scaleY = (height / Math.max(...self.dataSet.data));
        for(let i=0;i<self.dataSet.data.length;i++){ // For every element in the dataset, draw its line
          ctx.strokeStyle = self.options.lineColor;
          ctx.lineWidth = lineWidth;
          ctx.beginPath();
    
          let xPos = i*(width/self.dataSet.data.length);
          let yPos = height - (self.dataSet.data[i] * scaleY);
          
          if(self.dataSet.compIndicator.includes(i)){ // If the line is currently in a comparison, draw it in that colour
            ctx.lineWidth = lineWidth*3;
            ctx.strokeStyle = self.options.compColor;
          }
          
          if(self.dataSet.swapIndicator.includes(i)){ // If the line is currently in a swap, draw it in that colour
            ctx.lineWidth = lineWidth*3;
            ctx.strokeStyle = self.options.swapColor;
          }
          
          ctx.moveTo(xPos, height);
          ctx.lineTo(xPos, yPos);
          
          ctx.stroke();
    
          // Text Above bars
          if(self.options.displayValues){
            ctx.font = self.options.fontSize + 'px Arial';
            var textStr = `${self.dataSet.data[i]}`;
            ctx.fillText(textStr, xPos - (ctx.measureText(textStr).width / 2), yPos - 5);
          }
        }
      }},
      {name:"Vertical", func: ()=>{
        let ctx = self.ctx;
        let width = ctx.canvas.width = ctx.canvas.clientWidth;
        let height = ctx.canvas.height = ctx.canvas.clientHeight;
        let lineWidth = self.options.lineWidth || (width/self.dataSet.data.length)+0.5;
        for(let i=0;i<self.dataSet.data.length;i++){ // For every element in the dataset, draw its line
          ctx.strokeStyle = self.options.lineColor;
          ctx.lineWidth = lineWidth;
          ctx.beginPath();
    
          let scaleX = (width / Math.max(...self.dataSet.data));
          let barWidth = (self.dataSet.data[i] * scaleX);
          let x1 = width/2 - (barWidth/2);
          let x2 = width/2 + (barWidth/2);
          let yPos = i * (height/self.dataSet.data.length);
    
          let xPos = i*(width/self.dataSet.data.length);
          //let yPos = height - (self.dataSet.data[i] * scaleY);
          
          if(self.dataSet.compIndicator.includes(i)){ // If the line is currently in a comparison, draw it in that colour
            ctx.lineWidth = lineWidth*3;
            ctx.strokeStyle = self.options.compColor;
          }
          
          if(self.dataSet.swapIndicator.includes(i)){ // If the line is currently in a swap, draw it in that colour
            ctx.lineWidth = lineWidth*3;
            ctx.strokeStyle = self.options.swapColor;
          }
          
          ctx.moveTo(x1, yPos);
          ctx.lineTo(x2, yPos);
          
          ctx.stroke();
    
          // Text Above bars
          if(self.options.displayValues){
            ctx.font = self.options.fontSize + 'px Arial';
            var textStr = `${self.dataSet.data[i]}`;
            ctx.fillText(textStr, x1 - (ctx.measureText(textStr).width) -1, yPos + ((self.options.fontSize / 2) -3));
            ctx.fillText(textStr, x2, yPos + ((self.options.fontSize / 2) -3));
          }
        }
      }},
    ]

    self.structures = [
      {name:"Random", func: ()=>{
        self.dataSet.data = Array.from({length: self.options.size}, () => Math.floor(Math.random() * self.options.size));
      }},
      {name:"Random Unique", func: ()=>{
        self.dataSet.data = Array.from(new Array(self.options.size),(v,i)=>i);
        for (let i = self.dataSet.data.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [self.dataSet.data[i], self.dataSet.data[j]] = [self.dataSet.data[j], self.dataSet.data[i]];
        }
      }},
      {name:"Reverse Order", func: ()=>{
        self.dataSet.data = Array.from(new Array(self.options.size),(v,i)=>self.options.size-i);
      }},
      // {name:"Nearly Sorted", func: ()=>{
      //   // TODO: Make Nearly Sorted Arr
      // }},
      // {name:"Few Unique", func: ()=>{
      //   // TODO: Make Arr with a few unique values
      // }}
    ]

    self.algorithms = [

      {name:"Bubble Sort",algorithm: async ()=>{
        for (var i = ( self.dataSet.data.length - 1); i >= 0; i--){
          for (var j = ( self.dataSet.data.length - i); j > 0; j--){
            self.dataSet.iteration(); // Iterate counter etc...
            if (self.dataSet.lessthan(j, j-1)){
              self.dataSet.swap(j, j-1);
              await self.wait(self.options.delay); // Delay before next iteration
            }
          }
        }
        self.dataSet.swapIndicator = []; // Finished Empty active data
        self.dataSet.swapIndicator =[]; // Finished Empty active data
      }},

      {name:"Quick Sort",algorithm: async ()=>{
        var low = 0;
        var high = self.dataSet.data.length - 1;

        // Create an auxiliary stack and push inital values
        //int stack[high - low + 1]; 
        var stack = []; 
        var top = -1;
        stack[++top] = low; 
        stack[++top] = high; 
      
        // Keep popping from stack while is not empty 
        while (top >= 0) { 
          // Pop high and low 
          high = stack[top--]; 
          low = stack[top--]; 

          // Inline Partion Calculation
          var partitionIndex = (low - 1); 
        
          for (var j = low; j <= high - 1; j++) {
            self.dataSet.iteration(); // Iterate counter
            if (self.dataSet.lessthan(j, high)) { // Should be <=
            //if (self.dataSet.data[j] <= pivotValue) { 
              partitionIndex++; 
              self.dataSet.swap(partitionIndex, j);
              await self.wait(self.options.delay); // Delay before next iteration
            } 
          } 
          self.dataSet.swap(partitionIndex + 1, high);
          await self.wait(self.options.delay); // Delay before next iteration
          partitionIndex++;
          // End of Partition

          // If there are elements on left side of pivot, 
          // then push left side to stack 
          if (partitionIndex - 1 > low) { 
              stack[++top] = low; 
              stack[++top] = partitionIndex - 1; 
          } 
    
          // If there are elements on right side of pivot, 
          // then push right side to stack 
          if (partitionIndex + 1 < high) { 
              stack[++top] = partitionIndex + 1; 
              stack[++top] = high; 
          }
        }
      }},

      {name:"Selection Sort",algorithm: async ()=>{
        for(var i = 0; i < self.dataSet.data.length-1 ; i++)  {
          var minIdx = i ;
          for(var j = i+1; j < self.dataSet.data.length ; j++ ) {
            self.dataSet.iteration(); // Iterate counter
            if(self.dataSet.lessthan(j, minIdx))  { //finds the minIdx element
              minIdx = j ;
            }
            await self.wait(self.options.delay); // Delay before next iteration
          }
          self.dataSet.swap(minIdx, i);
        }
      }},

      {
        name: "Insertion Sort", algorithm: async () => {
          for(let i = 1; i < self.dataSet.data.length; i++){
            let value = self.dataSet.data[i];
            let j = i - 1;
            while(j >= 0 && self.dataSet.data[j] > value){
              self.dataSet.iteration(); // Iterate counter
              self.dataSet.swapIndicator = []
              self.dataSet.compIndicator = [j, i]; self.dataSet.compCount++;
              self.dataSet.data[j + 1] = self.dataSet.data[j];
              j = j - 1;
              await self.wait(self.options.delay);
            }
            self.dataSet.swapIndicator = [j + 1, i]; self.dataSet.swapCount++;
            self.dataSet.compIndicator = [];
            self.dataSet.data[j + 1] = value;
            await self.wait(self.options.delay);
          }
          self.dataSet.swapIndicator = []; // Finished Empty active data
          self.dataSet.compIndicator = []; // Finished Empty active data
        }
      },

      {
        name: "Shell Sort", algorithm: async () => {          
          // Define a gap distance.
          let gap = Math.floor(self.dataSet.data.length / 2);

          // Until gap is bigger then zero do elements comparisons and swaps.
          while (gap > 0) {
            // Go and compare all distant element pairs.
            for (let i = 0; i < (self.dataSet.data.length - gap); i += 1) {
              let currentIndex = i;
              let gapShiftedIndex = i + gap;

              while (currentIndex >= 0) {
                self.dataSet.iteration(); // Iterate counter
                // Compare and swap array elements if needed.
                if (self.dataSet.lessthan(gapShiftedIndex, currentIndex)) {
                  self.dataSet.swap(currentIndex, gapShiftedIndex);
                }
                await self.wait(self.options.delay); self
                gapShiftedIndex = currentIndex;
                currentIndex -= gap;
              }
            }

            // Shrink the gap.
            gap = Math.floor(gap / 2);
          }
        
          self.dataSet.swapIndicator = []; // Finished Empty active data
          self.dataSet.compIndicator = []; // Finished Empty active data
        }
      },

    ];
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*                                                   End Class                                                 */
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var AV;

window.onload = () => {
  let AVCanvas = document.getElementById("algorithm-visualiser");
  AV = new algorithmVisualiser(AVCanvas, {gui: true, fps: true});
};