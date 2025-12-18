export function textColorForBackground(bgColor: string) {
    if(bgColor?.length === 7) {
        let r = parseInt(bgColor.slice(1, 3), 16);
        let g = parseInt(bgColor.slice(3, 5), 16);
        let b = parseInt(bgColor.slice(5, 7), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 125 ? '#000000' : '#FFFFFF';
    } else if(bgColor?.length === 4) {
        let r = parseInt(bgColor.slice(1, 2).repeat(2), 16);
        let g = parseInt(bgColor.slice(2, 3).repeat(2), 16);
        let b = parseInt(bgColor.slice(3, 4).repeat(2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 125 ? '#000000' : '#FFFFFF';
    }
    return '#000000';
}

export function darkenButtonColor(color: string, amount: number) {
    if(color?.length === 7) {
        let r = Math.max(0, Math.min(255, parseInt(color.slice(1, 3), 16) - amount));
        let g = Math.max(0, Math.min(255, parseInt(color.slice(3, 5), 16) - amount));
        let b = Math.max(0, Math.min(255, parseInt(color.slice(5, 7), 16) - amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } else if(color?.length === 4) {
        let r = Math.max(0, Math.min(255, parseInt(color.slice(1, 2).repeat(2), 16) - amount));
        let g = Math.max(0, Math.min(255, parseInt(color.slice(2, 3).repeat(2), 16) - amount));
        let b = Math.max(0, Math.min(255, parseInt(color.slice(3, 4).repeat(2), 16) - amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    return color;
}