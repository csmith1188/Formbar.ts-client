import { IonIcon } from '@ionic/react';
import { Button, Flex } from 'antd';
import { Activity, useState } from 'react';
import {textColorForBackground} from '../CustomStyleFunctions';
import type { Student } from '../types';
import * as IonIcons from "ionicons/icons";

type AccordionCategory = {
    icon: string,
    content: React.ReactNode,
    enabled: boolean
}

export default function AccordionCollapse({ categories }: { categories: AccordionCategory[]} ) {
    const [currentIndex, setCurrentIndex] = useState<number | null>(null);
    const [expanded, setExpanded] = useState<boolean>(false);

    const baseColors = [
        '#ff6860',
        '#ff8f40',
        '#ffdf40',
        '#80ff80',
        '#bfcfff',
        '#df80ff',
        '#ff80bf'
    ];

    function interpolateColor(color1: string, color2: string, t: number): string {
        const r1 = parseInt(color1.slice(1, 3), 16);
        const g1 = parseInt(color1.slice(3, 5), 16);
        const b1 = parseInt(color1.slice(5, 7), 16);
        
        const r2 = parseInt(color2.slice(1, 3), 16);
        const g2 = parseInt(color2.slice(3, 5), 16);
        const b2 = parseInt(color2.slice(5, 7), 16);
        
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    }

    function generateColors(count: number): string[] {
        if (count <= 7) {
            return baseColors.slice(0, count);
        }
        
        const colors: string[] = [];
        
        if (count === 8) {
            colors.push(baseColors[0]);
            colors.push(baseColors[1]);
            colors.push(baseColors[2]);
            colors.push(baseColors[3]);
            colors.push(interpolateColor(baseColors[3], baseColors[4], 0.5));
            colors.push(baseColors[4]);
            colors.push(baseColors[5]);
            colors.push(baseColors[6]);
        } else if (count === 9) {
            colors.push(baseColors[0]);
            colors.push(baseColors[1]);
            colors.push(baseColors[2]);
            colors.push(interpolateColor(baseColors[2], baseColors[3], 0.5));
            colors.push(baseColors[3]);
            colors.push(interpolateColor(baseColors[3], baseColors[4], 0.5));
            colors.push(baseColors[4]);
            colors.push(baseColors[5]);
            colors.push(baseColors[6]);
        } else {
            for (let i = 0; i < count; i++) {
                const position = (i / (count - 1)) * (baseColors.length - 1);
                const lowerIndex = Math.floor(position);
                const upperIndex = Math.ceil(position);
                const t = position - lowerIndex;
                
                if (lowerIndex === upperIndex) {
                    colors.push(baseColors[lowerIndex]);
                } else {
                    colors.push(interpolateColor(baseColors[lowerIndex], baseColors[upperIndex], t));
                }
            }
        }
        
        return colors;
    }

    function colorIndex(index: number): string {
        const colors = generateColors(categories.length);
        return colors[index];
    }

    return (
        <>
            <Flex vertical style={{width: 'min-content'}}>
                <Flex gap={5}>
                {
                    categories && categories.map((category, index) => (
                        <Button key={index} style={{ 
                            backgroundColor: colorIndex(index),
                            width: '48px',
                            height: currentIndex === index && expanded ? '56px' : '48px',
                            border:'none',
                            borderRadius: '8px',
                            boxShadow: '0 3px 0px ' + colorIndex(index) + '55',
                            transition: 'all 0.2s ease-in-out',
                            borderBottomLeftRadius: currentIndex === index && expanded ? '0px' : '8px',
                            borderBottomRightRadius: currentIndex === index && expanded ? '0px' : '8px',
                            opacity: category.enabled ? 1 : 0.5,
                            scale: category.enabled ? 1 : 0.95,
                        }} shape='circle' onClick={() => {
                            if (currentIndex === index) {
                                setExpanded(!expanded);
                            } else {
                                setCurrentIndex(index);
                                setExpanded(true);
                            }
                        }} disabled={!category.enabled}>
                            <IonIcon icon={category.icon} style={{ fontSize: '30px', color: 'black', margin: '8px' }} />
                        </Button>
                    ))
                }
                </Flex>
                <Flex style={{
                    width: '100%',
                    background: colorIndex(currentIndex ?? 0),
                    color: textColorForBackground(colorIndex(currentIndex ?? 0)),
                    borderRadius: '6px',
                    borderTopLeftRadius: currentIndex === 0 ? '0px' : '6px',
                    borderTopRightRadius: currentIndex === (categories ? categories.length - 1 : 0) ? '0px' : '6px',
                    overflow: 'hidden',
                    height: expanded ? '100px' : '0px',
                    boxShadow: '0 3px 6px #00000055',
                    transition: 'height 0.2s ease-in-out',
                    padding: expanded ? '10px' : '0px'
                }}>
                    {
                        categories && categories.map((category, index) => (
                            <Activity key={index} mode={currentIndex === index && expanded ? 'visible' : 'hidden'}>
                                <div>
                                    {category.content}
                                </div>
                            </Activity>
                        ))
                    }
                </Flex>
            </Flex>
        </>
    );
}

export function StudentAccordion({ studentData }: { studentData: Student }) {
    return (
        <AccordionCollapse 
            categories={
                [
                    {
                        icon: IonIcons.handRightOutline,
                        content: (<p>Help</p>),
                        enabled: studentData.help
                    },
                    {
                        icon: IonIcons.umbrellaOutline,
                        content: (<p>Break</p>),
                        enabled: studentData.break !== false
                    },
                    {
                        icon: IonIcons.textOutline,
                        content: (<p>{studentData.pollRes.textRes}</p>),
                        enabled: studentData.pollRes.textRes !== ""
                    },
                    {
                        icon: IonIcons.lockClosedOutline,
                        content: <p>perms</p>,
                        enabled: true
                    },
                    {
                        icon: IonIcons.cashOutline,
                        content: <p>digipogs</p>,
                        enabled: true
                    },
                    {
                        icon: IonIcons.pricetagsOutline,
                        content: <p>tags</p>,
                        enabled: true
                    },
                    {
                        icon: IonIcons.banOutline,
                        content: <p>BanKick</p>,
                        enabled: true
                    }
                ]
            }
        />
    );
}