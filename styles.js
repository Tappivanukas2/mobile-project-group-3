import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    /* Styling for containers for the entire application */
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFF",
    },
    membersContainer: {
        margin: 15
    },
    /* Titles: sign in, sign up, settings, create group */
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
        color: "#A984BE"
    },
    /* Dark title */
    titleDark: {
        fontSize: 24,
        marginBottom: 20,
        color: "#000"
    },
    /* A smaller title */
    subtitle: {
        fontSize: 18,
        marginBottom: 10,
        color: "#000"
    },
    /* Text */
    regularText: {
        fontSize: 16,
        color: '#000'
    },
    centerText: {
        textAlign: 'center'
    },
    listText: {
        fontSize: 14,
        color: '#000'
    },
    /* Sign in and sign up "forms" */
    form: {
        backgroundColor: "#F5F5F5",
        width: "80%",
        padding: 20,
        borderRadius: 18,
        marginBottom: 10,
    },
    /* Form with black text and text centered in the middle */
    formTwo: {
        backgroundColor: "#F5F5F5",
        width: "80%",
        padding: 20,
        borderRadius: 18,
        marginBottom: 10,
        alignItems: "center",
    },
    /* Small text, links to new pages etc. */
    link: {
        color: "#A984BE",
        fontSize: 16,
        marginBottom: 8,
    },
    /* Input fields in forms */
    formInput: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#DDD",
        height: 30,
        marginBottom: 5,
        textAlignVertical: "center",
        paddingVertical: 0,
        paddingHorizontal: 10,
    },
    buttonOne: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#A984BE",
        width: "80%",
        height: 40,
        borderRadius: 18,
        marginVertical: 10,
    },
    /* Button where text is in the middle */
    buttonTwo: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#A984BE",
        width: "80%",
        height: 40,
        borderRadius: 18,
        marginVertical: 10,
    },
    /* Buttons in the my groups page */
    buttonThree: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#A984BE",
        width: "100%",
        height: 40,
        borderRadius: 18,
        marginVertical: 10,
    },
    buttonForm: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#A984BE",
        height: 40,
        borderRadius: 18,
        marginTop: 8,
        marginBottom: 5,
    },
    buttonForm2: {
        backgroundColor: '#A984BE',
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    /* Button text aligned left */
    buttonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
        marginLeft: 20,
    },
    /* Button text in the middle of the button */
    buttonTextMiddle: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center"
    },
    iconStyle: {
        marginRight: 20,
        fontWeight: "bold",
    },
    profile: {
        margin: 30,
    },
    avatar: {
        width: 150,
        height: 150,
        borderRadius: 75,
    },
    /* My groups page groups list*/
    list:{
        width: "80%",
        padding: 20,
        borderRadius: 18,
        marginBottom: 10,
    },
    inputActive: {
        backgroundColor: '#ffffff',
        color: '#000000', // Black text color for active fields
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 10,
      },
    inputInactive: {
        backgroundColor: '#f0f0f0',
        color: '#aaaaaa', // Greyed out text color
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 10,
    },
    /* Modal layout */
    modalOverlay: {
        flex: 1,
        padding: 5,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
        width: "85%",
        backgroundColor: "#FFF",
        borderRadius: 18,
        padding: 20,
        paddingBottom: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    settingsContainer: {
        paddingTop: 40,
        alignItems: "center",
    },
    settingsForm: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginVertical: 1,
        width: "90%",
    },
    settingsFormTwo: {
        marginVertical: 16,
        width: "90%",
    },
    settingsButton: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#A984BE",
        width: "90%",
        height: 40,
        borderRadius: 18,
        marginVertical: 10,
    },
    deleteContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 15,
    },
    deleteText: {
        color: "red",
        fontSize: 14,
        marginRight: 5,
        textDecorationLine: "underline",
    },
    /* A delete icon "X" for a touchable */
    deleteIconForTouchable: {
        marginRight: 5, 
        padding: 5,
        borderRadius: 18,
    },
    /*
        Styling for MyBudget page
        (Some elements fit GroupBudget as well)
    */
    pickerWrapper: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        marginBottom: 10,
        backgroundColor: '#fff'
    },
    categorySummary: {
        width: '100%',
        backgroundColor: '#e7e7e7',
        borderRadius: 10,
        padding: 10,
        marginVertical: 5,
        alignSelf: 'center',
    },
    categorySummaryText: {
        fontSize: 14,
        textAlign: 'left',
        color: '#000'
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    message: {
        marginTop: 16,
        fontSize: 16,
        color: 'green',
    },
    /*remaining: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'blue',
    },*/
    budgetItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    deleteButton: {
        fontSize: 18,
        color: 'red',
        paddingHorizontal: 8,
    },
    groupItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    groupText: {
        fontSize: 16,
    },
    chatContainer: {
        position: 'absolute',
        bottom: 80, // Slightly above the bottom edge for better spacing
        right: 25, // Aligns the icon to the bottom-right corner
        backgroundColor: 'white',
        borderRadius: 25,
        padding: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    /* Footer */
    footer: {
        backgroundColor: "#A984BE",
        height: 50,
        width: "100%",
        position: "absolute",
        bottom: 0,
    },
    badge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: 'red',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
      
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    /*fakeInput: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        height: 50,
        borderColor: "#4F4F4F",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 25,
        fontSize: 16,
        backgroundColor: "#fff",
        color: "#4F4F4F",
        marginBottom: 10,
        width: "90%"
    },*/
    /* GroupBudget page */
    rowContainer: {
        marginVertical: 10,
    },
    editRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 6
    },
    remainingInputInline: {
        flex: 1
    },
    editInput: {
        backgroundColor: '#ffffff',
        color: '#000000',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5
    },
    settingsContainer2: {
        flex: 1,
        paddingTop: 40,
        paddingHorizontal: 15,
    },
    settingsContainer2DarkMode: {
        flex: 1,
        paddingTop: 40,
        paddingHorizontal: 15,
        backgroundColor: "#1A1A1A"
    },
    settingsTitleWrapper: {
        alignItems: 'center',
        marginTop: 40,
    }, 
    settingsTitle: {
        textAlign: 'center',
    },
    membersSection: {
        paddingHorizontal: 30,
    },
    membersLabel: {
        textAlign: 'left',
        marginBottom: 10,
    },
    addMembersLink: {
        marginTop: 15,
    },
    deleteWrapper: {
        alignItems: 'center',
        marginBottom: 40,
    },
    membersList: {
        maxHeight: 250,
    },      

    /* DARK MODE */
    /* Styling for containers for the entire application */
    containerDarkMode: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#1A1A1A",
    },
    /* Titles: sign in, sign up, settings, create group */
    titleDarkMode: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
        color: "#A984BE"
    },
    /* Dark title */
    titleLight: {
        fontSize: 24,
        marginBottom: 20,
        color: "#FFF"
    },
    /* A smaller title */
    subtitleDarkMode: {
        fontSize: 18,
        marginBottom: 10,
        color: "#FFF"
    },
    /* Text */
    regularTextDarkMode: {
        fontSize: 16,
        color: '#fff'
    },
    listTextDarkMode: {
        fontSize: 14,
        color: '#fff'
    },
    /* Sign in and sign up "forms" */
    formDarkMode: {
        backgroundColor: "#2C2C2C",
        width: "80%",
        padding: 20,
        borderRadius: 18,
        marginBottom: 10,
    },
    /* Form with black text and text centered in the middle */
    formTwoDarkMode: {
        backgroundColor: "#2C2C2C",
        width: "80%",
        padding: 20,
        borderRadius: 18,
        marginBottom: 10,
        alignItems: "center",
    },
    /* Input fields in forms */
    formInputDarkMode: {
        backgroundColor: "#444444",
        color: '#fff',
        borderWidth: 1,
        borderColor: "#6B6B6B",
        height: 30,
        marginBottom: 5,
        textAlignVertical: "center",
        paddingVertical: 0,
        paddingHorizontal: 10,
    },
    inputActiveDarkMode: {
        backgroundColor: '#444444',
        color: '#FFF',
        padding: 10,
        borderWidth: 1,
        borderColor: '#6B6B6B',
        borderRadius: 5,
        marginBottom: 10,
    },
    inputInactiveDarkMode: {
        backgroundColor: '#303030',
        color: '#6B6B6B',
        padding: 10,
        borderWidth: 1,
        borderColor: '#6B6B6B',
        borderRadius: 5,
        marginBottom: 10,
    },
    /* Modal layout */
    modalOverlayDarkMode: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContentDarkMode: {
        width: "85%",
        backgroundColor: "#1A1A1A",
        borderRadius: 18,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    scrollViewDarkMode: {
        flex: 1,
        padding: 16,
        backgroundColor: '#1A1A1A',
    },
    settingsContainerDarkMode: {
        backgroundColor: '#1A1A1A',
        paddingTop: 40,
        alignItems: "center",
    },
    chatContainerDarkMode: {
        position: 'absolute',
        bottom: 80,
        right: 25,
        backgroundColor: '#1A1A1A',
        borderRadius: 25,
        padding: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    groupItemDarkMode: {
        padding: 10,
        borderBottomWidth: 0.7,
        borderBottomColor: '#6B6B6B',
    },
    categorySummaryDarkMode: {
        padding: 10,
        backgroundColor: '#313131',
        borderRadius: 10,
        marginBottom: 8,
    },
    categorySummaryTextDarkMode: {
        fontSize: 14,
        textAlign: 'left',
        color: '#fff'
    },
    budgetItemDarkMode: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#6B6B6B',
    },
    pickerWrapperDarkMode: {
        borderWidth: 1,
        borderColor: '#6B6B6B',
        borderRadius: 6,
        marginBottom: 10,
        backgroundColor: '#444444'
    },
    subtitleDarkMode: {
        fontSize: 18,
        marginBottom: 10,
        color: "#fff"
    },
    editInputDarkMode: {
        backgroundColor: '#444444',
        color: '#fff',
        padding: 10,
        borderWidth: 1,
        borderColor: '#6B6B6B',
        borderRadius: 5,
    },
})

export default styles;