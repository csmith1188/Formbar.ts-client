import { Button, Flex, Tooltip, Popconfirm, Select, Popover } from 'antd'
import { IonIcon } from '@ionic/react';
import * as IonIcons from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';

import { useMobileDetect, useTheme } from '../main';
import { themeColors, version } from '../../themes/GlobalConfig';

import pages from '../pages';

export default function FormbarHeader() {
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const isMobileView = useMobileDetect();

    const headerStyles = {
        ...styles.formbarHeader,
        background: isDark 
            ? themeColors.dark.header.background
            : themeColors.light.header.background,
    };

    const primaryTextColor = isDark
        ? themeColors.dark.text.primary
        : themeColors.light.text.primary;

    const secondaryTextColor = isDark
        ? themeColors.dark.text.secondary
        : themeColors.light.text.secondary;

    // Sort pages alphabetically by pageName
    const sortedPages = [...pages].sort((a, b) => 
        (a.pageName ?? '').toLowerCase().localeCompare((b.pageName ?? '').toLowerCase())
    );

    return (
        <Flex style={headerStyles} align="center" className='formbarHeader' justify="space-between" gap="16">
            {
                isMobileView ? ( <Flex align="center" justify="center">
                    <Tooltip title={<span>Formbar <span style={{marginLeft:'4px', fontWeight:'600'}}>v{version}</span></span>} placement="bottomLeft" arrow={{pointAtCenter: true}} color='purple'>
                    <img src="/img/FormbarLogo-Circle.png" alt="Formbar Logo" style={{ height: 40, filter: "drop-shadow(0 0 5px rgba(0,0,0,0.5))" }} />
                    </Tooltip>
                </Flex>
                ) : (
                    <h1 style={{ ...styles.formbarHeader.text, color: primaryTextColor }}>
                        Formbar
                        <span style={{ ...styles.formbarHeader.version, color: secondaryTextColor }}>v{version}</span>
                    </h1>
                )
            }
            <Flex align="center" justify="center" gap={10}>
                <Popover placement="bottomRight" trigger='click' content={
                    <>
                        <Select defaultValue="Pages" style={{ width: 120 }} variant='borderless' onChange={(value) => navigate(value.replaceAll('*',''))} size='small' showSearch={{
                        optionFilterProp: 'label',
                        filterSort: (optionA, optionB) =>
                            (String(optionA?.label) ?? '').toLowerCase().localeCompare((String(optionB?.label) ?? '').toLowerCase()),
                        }}>
                            {
                                sortedPages.map((page, index) => (
                                    <Select.Option key={index} value={page.routePath}>{page.pageName}</Select.Option>
                                ))
                            }
                        </Select>
                    </>
                } arrow={{pointAtCenter: true}} color="red">
                    <Button type='default' variant='solid' color='red' size='large' style={styles.headerButton}>
                        <IonIcon icon={IonIcons.layers} size='large' />
                    </Button>
                </Popover>

                <Tooltip placement="bottomRight" title={isDark ? "Light Mode" : "Dark Mode"} arrow={{pointAtCenter: true}} color="blue">
                    <Button type='primary' color='blue' onClick={toggleTheme} size='large' style={styles.headerButton}>
                        <IonIcon icon={isDark ? IonIcons.sunny : IonIcons.moon} size='large' />
                    </Button>
                </Tooltip>

                <Tooltip placement="bottomRight" title="Profile" arrow={{pointAtCenter: true}} color='blue'>
                    <Button type='primary' color='blue' size='large' style={styles.headerButton} onClick={() => navigate('/profile')}>
                        <IonIcon icon={IonIcons.person} size='large' />
                    </Button>
                </Tooltip>

                <Tooltip placement="bottomRight" title="Log Out" arrow={{pointAtCenter: true}} color='blue'>
                    <Popconfirm
                        placement='bottomRight'
                        title={"Wait! Are you sure you would like to log out?"}
                        icon={<IonIcon icon={IonIcons.alertCircle} color='red' size='large' style={{marginRight:'4px',marginTop:'3px'}}/>}
                        cancelText={"No"}
                        okText={"Yes"}
                        okType='danger'
                        onConfirm={() => navigate('/login')}
                    >
                        
                            <Button type='primary' color='blue' size='large' style={styles.headerButton}>
                                <IonIcon icon={IonIcons.logOut} size='large' />
                            </Button>
                    </Popconfirm>
                </Tooltip>

            </Flex>
        </Flex>
    );
}

const styles = {
    formbarHeader: {
        position: 'absolute' as 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '63px',
        padding: '0 32px',

        zIndex: 2,

        borderBottom: '3px solid #00000050',
        
        background: 'linear-gradient(90deg, #1CB5E0 0%, #000851 100%)',

        text: {
            fontSize: '36px',
            position: 'relative' as 'relative',
            color: 'white'
        },

        version: {
            fontSize: '18px',
            marginTop: 'auto',
            marginBottom: '5px',
            marginLeft: '8px',
            fontWeight: '300' as '300',
            color: '#ffffffaa',
        }
    },

    headerButton: {
        padding: '0 20px',
    }
};