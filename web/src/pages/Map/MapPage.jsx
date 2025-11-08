import { useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { GraphContainer } from './Graph.jsx';
import { Header } from './Header.jsx';
import { Sidebar } from './Sidebar.jsx';

function useD3Zoom(svgRef, rootRef, zoomRef) {
    useEffect(() => {
        const svg = d3.select(svgRef.current);
        const root = d3.select(rootRef.current);

        zoomRef.current = d3.zoom().on('zoom', (event) => {
            root.attr('transform', event.transform);
        });

        svg.call(zoomRef.current);
    }, [svgRef, rootRef, zoomRef]);
}

export function MapPage() {
    const [selectedChannel, setSelectedChannel] = useState('');
    const svgRef = useRef();
    const rootRef = useRef();
    const zoomRef = useRef();
    const [data, setData] = useState(null);

    useEffect(() => {
        async function load() {
            const res = await fetch('/data.json'); // ✅ Cloudflare Pages 배포 후에도 동일
            const json = await res.json();
            setData(json);
        }
        load();
    }, []);

    useD3Zoom(svgRef, rootRef, zoomRef);

    const handleChannelSearch = (e) => {
        const channelName = e.target.value;
        setSelectedChannel(channelName);

        const selectedNode = data.nodes.find((node) => node.name === channelName);
        if (!selectedNode) return;

        const width = window.innerWidth;
        const height = window.innerHeight;
        const svg = d3.select(svgRef.current);

        svg.transition().duration(1000).call(
            zoomRef.current.transform,
            d3.zoomIdentity
                .translate(width / 2, height / 2)
                .translate(-selectedNode.x, -selectedNode.y)
        );
    };

    return (
        <>
            <GraphContainer
                data={data}
                selectedChannel={selectedChannel}
                setSelectedChannel={setSelectedChannel}
                svgRef={svgRef}
                rootRef={rootRef}
            />
            <Sidebar
                data={data}
                selectedChannel={selectedChannel}
                handleChannelSearch={handleChannelSearch}
            />
            <Header data={data} />
        </>
    );
}

export default MapPage;

