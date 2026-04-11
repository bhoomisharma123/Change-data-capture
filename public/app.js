document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const metricBuffer = document.getElementById("metric-buffer");
    const metricTimer = document.getElementById("metric-timer");
    const metricBatches = document.getElementById("metric-batches");
    const configDebounce = document.getElementById("config-debounce");
    const configBatchSize = document.getElementById("config-batch-size");
    const batchesContainer = document.getElementById("batches-container");
    const btnReloadConfig = document.getElementById("btn-reload-config");
    const btnSimulate = document.getElementById("btn-simulate");

    // State
    let lastProcessedCount = -1;

    // Fetch Status
    async function fetchStatus() {
        try {
            const res = await fetch("/api/status");
            const json = await res.json();
            if (json.success && json.data) {
                const { bufferedEvents, isTimerActive, config, recentBatches } = json.data;
                
                // Update specific metrics
                metricBuffer.textContent = bufferedEvents;
                metricBuffer.className = bufferedEvents > 0 ? "metric highlight" : "metric";
                
                metricTimer.textContent = isTimerActive ? "Active" : "Idle";
                metricTimer.style.color = isTimerActive ? "var(--accent-color)" : "inherit";
                
                metricBatches.textContent = recentBatches;

                // Update config
                if (config) {
                    configDebounce.textContent = `${config.debounceIntervalMs}ms`;
                    configBatchSize.textContent = config.maxBatchSize;
                }
            }
        } catch (error) {
            console.error("Failed to fetch status:", error);
        }
    }

    // Fetch Batches
    async function fetchBatches() {
        try {
            const res = await fetch("/api/batches");
            const json = await res.json();
            
            if (json.success && json.data) {
                // Determine if we need to rerender (super simple approach: check total count)
                if (json.data.length !== lastProcessedCount) {
                    renderBatches(json.data);
                    lastProcessedCount = json.data.length;
                }
            }
        } catch (error) {
            console.error("Failed to fetch batches:", error);
        }
    }

    function renderBatches(batches) {
        if (!batches || batches.length === 0) {
            batchesContainer.innerHTML = '<div class="empty-state">Waiting for CDC events...</div>';
            return;
        }

        batchesContainer.innerHTML = "";
        
        batches.forEach((batch, index) => {
            const batchEl = document.createElement("div");
            batchEl.className = "batch-card";
            batchEl.style.animationDelay = `${index * 0.1}s`;

            const date = new Date(batch.processedAt);
            const timeStr = date.toLocaleTimeString();

            let eventsHtml = '<div class="event-list">';
            batch.events.forEach(ev => {
                const opType = ev.operationType || 'unknown';
                const typeClass = `op-${opType}`;
                const collName = ev.ns ? ev.ns.coll : 'unknown';
                
                eventsHtml += `
                    <div class="event-item">
                        <span class="op-type ${typeClass}">${opType}</span>
                        <span>Coll: <strong>${collName}</strong></span>
                        <span style="opacity:0.6;font-size:0.75rem;">ID: ${ev.eventId}</span>
                    </div>
                `;
            });
            eventsHtml += '</div>';

            batchEl.innerHTML = `
                <div class="batch-header">
                    <span class="batch-time">Processed at: ${timeStr}</span>
                    <span class="batch-count">${batch.eventCount} events</span>
                </div>
                ${eventsHtml}
            `;

            batchesContainer.appendChild(batchEl);
        });
    }

    // Actions
    btnReloadConfig.addEventListener("click", async () => {
        const ogText = btnReloadConfig.innerHTML;
        btnReloadConfig.innerHTML = "Reloading...";
        try {
            await fetch("/api/reload-config", { method: "POST" });
            await fetchStatus();
            setTimeout(() => { btnReloadConfig.innerHTML = "✅ Reloaded"; }, 500);
            setTimeout(() => { btnReloadConfig.innerHTML = ogText; }, 2000);
        } catch (err) {
            btnReloadConfig.innerHTML = "❌ Failed";
            setTimeout(() => { btnReloadConfig.innerHTML = ogText; }, 2000);
        }
    });

    btnSimulate.addEventListener("click", async () => {
        const ogText = btnSimulate.innerHTML;
        btnSimulate.innerHTML = "Simulating...";
        try {
            await fetch("/api/simulate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    operationType: "simulate",
                    targetCollection: "users",
                    documentId: `test-${Math.floor(Math.random() * 10000)}`,
                    data: { name: "Test User UI", timestamp: new Date().toISOString() }
                })
            });
            await fetchStatus();
            setTimeout(() => { btnSimulate.innerHTML = "✅ Simulated"; }, 500);
            setTimeout(() => { btnSimulate.innerHTML = ogText; }, 2000);
        } catch (err) {
            btnSimulate.innerHTML = "❌ Failed";
            setTimeout(() => { btnSimulate.innerHTML = ogText; }, 2000);
        }
    });

    // Polling interval
    setInterval(() => {
        fetchStatus();
        fetchBatches();
    }, 1500);

    // Initial fetch
    fetchStatus();
    fetchBatches();
});
