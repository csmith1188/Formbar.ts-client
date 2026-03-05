import {
    Button,
    Flex,
    Typography,
} from 'antd';

const { Title, Text } = Typography;

import { useMobileDetect, useTheme } from '../main';
import { themeColors } from '../../themes/ThemeConfig';

import { useNavigate } from 'react-router-dom';

export default function NotFound() {
    const navigate = useNavigate();
    const isMobile = useMobileDetect();

    console.log('isMobile:', isMobile, 'width:', window.innerWidth);

    const { isDark } = useTheme();

    const backgroundColor = isDark ? themeColors.dark.body.background : themeColors.light.body.background;
    const textColor = isDark ? themeColors.dark.text.primary : themeColors.light.text.primary;

    return (
        <Flex vertical justify='center' align='center' style={{ height: '100vh', backgroundColor }}>
            <Title level={isMobile ? 3 : 1} style={{ color: textColor, textAlign: 'center' }}>404 - Page Not Found</Title>
            <Text style={{ color: textColor, marginBottom: 20, textAlign: 'center' }}>
                Oops! The page you're looking for doesn't exist.
            </Text>
            <Button type='primary' onClick={() => navigate('/')}>
                Go to Home
            </Button>
        </Flex>
    );
}